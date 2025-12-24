import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Fonction helper pour vérifier si un tunnel existe
async function checkTunnelExists(tunnelName: string, cloudflaredPath: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const { stdout } = await execAsync(`powershell -Command "& '${cloudflaredPath.replace(/'/g, "''")}' tunnel list 2>&1"`)
    if (stdout && stdout.includes(tunnelName)) {
      return { exists: true }
    }
    return { exists: false, error: 'Tunnel non trouvé dans la liste' }
  } catch (error: any) {
    console.error('[CLOUDFLARE API] Erreur vérification tunnel:', error)
    return { exists: false, error: error.message || 'Erreur lors de la vérification' }
  }
}

// Fonction helper pour trouver cloudflared
async function findCloudflaredPath(): Promise<string | null> {
  // Méthode 1: Utiliser PowerShell Get-Command (cherche dans tout le PATH système)
  try {
    const { stdout } = await execAsync('powershell -Command "$env:Path = [System.Environment]::GetEnvironmentVariable(\'Path\', \'Machine\') + \';\' + [System.Environment]::GetEnvironmentVariable(\'Path\', \'User\'); Get-Command cloudflared -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source"')
    if (stdout && stdout.trim() && !stdout.includes('Cannot find')) {
      return stdout.trim()
    }
  } catch (error) {
    // Get-Command n'a pas trouvé cloudflared
  }
  
  // Méthode 2: Emplacements par défaut
  const defaultPaths = [
    'C:\\Program Files\\Cloudflare\\cloudflared.exe',
    'C:\\Program Files (x86)\\Cloudflare\\cloudflared.exe',
  ]
  
  for (const path of defaultPaths) {
    try {
      const { stdout } = await execAsync(`powershell -Command "Test-Path '${path}'"`)
      if (stdout && stdout.trim().toLowerCase() === 'true') {
        return path
      }
    } catch (error) {
      // Ce chemin n'existe pas
    }
  }
  
  return null
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier si cloudflared est installé
    let cloudflaredInstalled = false
    let cloudflaredVersion = ''
    
    // Trouver cloudflared
    let cloudflaredPath: string | null = await findCloudflaredPath()
    
    // Essayer d'exécuter cloudflared pour vérifier qu'il fonctionne
    try {
      // Mettre à jour le PATH pour inclure les emplacements courants
      const updatedPath = [
        process.env.PATH || '',
        'C:\\Program Files\\Cloudflare',
        'C:\\Program Files (x86)\\Cloudflare',
        process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages` : '',
      ].filter(Boolean).join(';')
      
      const command = cloudflaredPath ? `"${cloudflaredPath}" --version` : 'cloudflared --version'
      const { stdout } = await execAsync(command, {
        env: {
          ...process.env,
          PATH: updatedPath,
        },
      })
      cloudflaredInstalled = true
      cloudflaredVersion = stdout.trim()
      if (!cloudflaredPath) {
        // Si on a réussi sans chemin, essayer de le trouver maintenant
        cloudflaredPath = await findCloudflaredPath()
      }
      console.log('[CLOUDFLARE API] ✅ cloudflared détecté, version:', cloudflaredVersion, 'chemin:', cloudflaredPath || 'PATH')
    } catch (error: any) {
      cloudflaredInstalled = false
      console.log('[CLOUDFLARE API] ❌ cloudflared non trouvé:', error.message)
    }

    // Vérifier si le service cloudflared est en cours d'exécution (Windows)
    let serviceRunning = false
    let serviceStatus = ''
    try {
      const { stdout } = await execAsync('powershell -Command "Get-Service cloudflared -ErrorAction SilentlyContinue | Select-Object -Property Status,Name | ConvertTo-Json"')
      if (stdout && !stdout.includes('Cannot find')) {
        const service = JSON.parse(stdout)
        serviceRunning = service.Status === 'Running'
        serviceStatus = service.Status
      }
    } catch (error) {
      // Service non installé ou erreur
    }

    // Vérifier si un processus cloudflared est en cours d'exécution
    let processRunning = false
    let processInfo = null
    try {
      const { stdout } = await execAsync('powershell -Command "Get-Process cloudflared -ErrorAction SilentlyContinue | Select-Object -Property Id,ProcessName,StartTime | ConvertTo-Json -Compress"')
      if (stdout && stdout.trim() && !stdout.includes('Cannot find') && !stdout.includes('Get-Process')) {
        try {
          const processes = JSON.parse(stdout)
          if (Array.isArray(processes) && processes.length > 0) {
            processRunning = true
            processInfo = processes[0]
          } else if (processes && processes.Id) {
            processRunning = true
            processInfo = processes
          }
        } catch (parseError) {
          // Erreur de parsing JSON, mais processus peut exister
          if (stdout.includes('cloudflared')) {
            processRunning = true
          }
        }
      }
    } catch (error: any) {
      // Aucun processus en cours ou erreur
      if (!error.message.includes('Cannot find')) {
        console.log('[CLOUDFLARE API] Erreur vérification processus:', error.message)
      }
    }

    // Lister les tunnels disponibles
    let tunnels: any[] = []
    if (cloudflaredInstalled && cloudflaredPath) {
      try {
        const command = `powershell -Command "& '${cloudflaredPath}' tunnel list"`
        const { stdout } = await execAsync(command)
        // Parser la sortie pour extraire les tunnels
        // Format attendu: ID | NAME | CREATED
        const lines = stdout.split('\n').filter(line => line.trim() && !line.startsWith('ID') && !line.includes('---'))
        lines.forEach((line) => {
          if (line.includes('|')) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p)
            if (parts.length >= 2) {
              tunnels.push({
                id: parts[0],
                name: parts[1],
              })
            }
          } else if (line.match(/^[a-f0-9-]+\s+\w+/)) {
            // Format alternatif sans séparateur |
            const match = line.match(/^([a-f0-9-]+)\s+(\w+)/)
            if (match) {
              tunnels.push({
                id: match[1],
                name: match[2],
              })
            }
          }
        })
      } catch (error: any) {
        console.log('[CLOUDFLARE API] Erreur lors de la liste des tunnels:', error.message)
        // Erreur lors de la liste des tunnels (peut-être pas connecté)
      }
    }

    return NextResponse.json({
      cloudflaredInstalled,
      cloudflaredVersion,
      cloudflaredPath: cloudflaredPath || undefined,
      serviceRunning,
      serviceStatus,
      processRunning,
      processInfo,
      tunnels,
    })
  } catch (error: any) {
    console.error('[CLOUDFLARE API] Erreur GET:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { action, tunnelName } = body

    if (!action || !['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez: start, stop, ou restart' },
        { status: 400 }
      )
    }

    if (action === 'start' && !tunnelName) {
      return NextResponse.json(
        { error: 'Le nom du tunnel est requis pour démarrer' },
        { status: 400 }
      )
    }

    let result = null
    let message = ''

    if (action === 'start') {
      // Démarrer le tunnel
      try {
        // Trouver le chemin de cloudflared
        const cloudflaredPath = await findCloudflaredPath()
        if (!cloudflaredPath) {
          throw new Error('cloudflared non trouvé. Assurez-vous qu\'il est installé et dans le PATH.')
        }
        
        console.log('[CLOUDFLARE API] Démarrage du tunnel:', tunnelName, 'avec le chemin:', cloudflaredPath)
        
        // Vérifier si le service existe (plusieurs méthodes)
        let serviceExists = false
        let serviceName = 'cloudflared'
        
        try {
          // Méthode 1: Get-Service standard
          const { stdout: serviceCheck1 } = await execAsync('powershell -Command "Get-Service cloudflared -ErrorAction SilentlyContinue | Select-Object -Property Name,Status"')
          if (serviceCheck1 && !serviceCheck1.includes('Cannot find') && !serviceCheck1.includes('ObjectNotFound')) {
            serviceExists = true
            console.log('[CLOUDFLARE API] Service cloudflared trouvé:', serviceCheck1.trim())
          } else {
            // Méthode 2: Recherche par nom partiel
            const { stdout: serviceCheck2 } = await execAsync('powershell -Command "Get-Service | Where-Object { $_.Name -like \'*cloudflare*\' } | Select-Object -Property Name,Status"')
            if (serviceCheck2 && serviceCheck2.trim()) {
              serviceExists = true
              console.log('[CLOUDFLARE API] Service cloudflared trouvé (recherche partielle):', serviceCheck2.trim())
              // Extraire le nom du service
              const match = serviceCheck2.match(/Name\s+:\s+(\S+)/)
              if (match) {
                serviceName = match[1]
              }
            }
          }
        } catch (error) {
          console.log('[CLOUDFLARE API] Service non trouvé, continuation avec démarrage manuel')
        }
        
        if (serviceExists) {
          try {
            // Démarrer le service
            console.log('[CLOUDFLARE API] Démarrage du service cloudflared:', serviceName)
            await execAsync(`powershell -Command "Start-Service ${serviceName}"`)
            // Attendre un peu pour vérifier que le service démarre
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            // Vérifier que le service est bien démarré
            const { stdout: serviceStatus } = await execAsync(`powershell -Command "Get-Service ${serviceName} | Select-Object -Property Status"`)
            if (serviceStatus && serviceStatus.includes('Running')) {
              message = `Service cloudflared démarré avec succès`
              result = { service: 'started' }
            } else {
              throw new Error('Le service a été démarré mais n\'est pas en cours d\'exécution')
            }
          } catch (serviceError: any) {
            console.error('[CLOUDFLARE API] Erreur démarrage service:', serviceError)
            // Si le service échoue, essayer de démarrer manuellement
            serviceExists = false
          }
        }
        
        if (!serviceExists) {
          // Vérifier d'abord si le tunnel existe
          console.log('[CLOUDFLARE API] Vérification de l\'existence du tunnel:', tunnelName)
          const tunnelCheck = await checkTunnelExists(tunnelName, cloudflaredPath)
          if (!tunnelCheck.exists) {
            throw new Error(`Le tunnel "${tunnelName}" n'existe pas. Créez-le avec: cloudflared tunnel create ${tunnelName}`)
          }
          
          // Démarrer le tunnel manuellement avec PowerShell
          console.log('[CLOUDFLARE API] Démarrage du tunnel en processus')
          
          // Créer un fichier temporaire pour capturer les erreurs
          const errorLogPath = `${process.env.TEMP || 'C:\\Windows\\Temp'}\\cloudflared_${tunnelName}_${Date.now()}.log`
          
          try {
            // Démarrer cloudflared avec redirection d'erreur vers un fichier
            const startCommand = `powershell -Command "$process = Start-Process -FilePath '${cloudflaredPath.replace(/'/g, "''")}' -ArgumentList 'tunnel', 'run', '${tunnelName}' -WindowStyle Hidden -PassThru -RedirectStandardError '${errorLogPath.replace(/'/g, "''")}' -ErrorAction Stop; if ($process) { Write-Output $process.Id } else { Write-Output 'FAILED' }"`
            const { stdout: processIdOutput } = await execAsync(startCommand)
            const processId = processIdOutput?.trim()
            
            console.log('[CLOUDFLARE API] Processus démarré avec ID:', processId)
            
            if (!processId || processId === 'FAILED') {
              throw new Error('Le processus n\'a pas pu être démarré')
            }
            
            // Attendre un peu pour vérifier que le processus démarre
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            // Vérifier que le processus est toujours en cours
            try {
              // Vérifier par ID
              const { stdout: checkById } = await execAsync(`powershell -Command "Get-Process -Id ${processId} -ErrorAction SilentlyContinue | Select-Object -Property Id,ProcessName"`)
              
              // Vérifier aussi par nom au cas où l'ID change
              const { stdout: checkByName } = await execAsync(`powershell -Command "Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Select-Object -Property Id,ProcessName | ConvertTo-Json"`)
              
              if ((checkById && checkById.trim()) || (checkByName && checkByName.trim())) {
                console.log('[CLOUDFLARE API] Processus vérifié - Par ID:', checkById?.trim(), 'Par nom:', checkByName?.trim())
                message = `Tunnel ${tunnelName} démarré en arrière-plan (PID: ${processId})`
                result = { tunnel: 'started', name: tunnelName, processId: processId }
              } else {
                // Le processus s'est arrêté, lire le fichier d'erreur
                let errorDetails = ''
                try {
                  const fs = require('fs')
                  if (fs.existsSync(errorLogPath)) {
                    errorDetails = fs.readFileSync(errorLogPath, 'utf8').trim()
                    console.error('[CLOUDFLARE API] Erreur cloudflared:', errorDetails)
                  }
                } catch (readError) {
                  // Ignorer les erreurs de lecture
                }
                
                const errorMsg = errorDetails 
                  ? `Le processus cloudflared s'est arrêté immédiatement. Erreur: ${errorDetails.substring(0, 200)}`
                  : 'Le processus cloudflared s\'est arrêté immédiatement. Vérifiez que vous êtes authentifié avec: cloudflared tunnel login'
                
                throw new Error(errorMsg)
              }
            } catch (checkError: any) {
              console.error('[CLOUDFLARE API] Erreur vérification processus:', checkError)
              
              // Lire le fichier d'erreur si disponible
              let errorDetails = ''
              try {
                const fs = require('fs')
                if (fs.existsSync(errorLogPath)) {
                  errorDetails = fs.readFileSync(errorLogPath, 'utf8').trim()
                  console.error('[CLOUDFLARE API] Erreur cloudflared:', errorDetails)
                }
              } catch (readError) {
                // Ignorer
              }
              
              const errorMsg = errorDetails
                ? `Le processus cloudflared s'est arrêté. Erreur: ${errorDetails.substring(0, 200)}`
                : checkError.message || 'Le processus cloudflared s\'est arrêté immédiatement'
              
              throw new Error(errorMsg)
            }
          } catch (startError: any) {
            console.error('[CLOUDFLARE API] Erreur démarrage processus:', startError)
            
            // Lire le fichier d'erreur si disponible
            let errorDetails = ''
            try {
              const fs = require('fs')
              if (fs.existsSync(errorLogPath)) {
                errorDetails = fs.readFileSync(errorLogPath, 'utf8').trim()
                console.error('[CLOUDFLARE API] Erreur cloudflared:', errorDetails)
              }
            } catch (readError) {
              // Ignorer
            }
            
            // Essayer une méthode alternative: utiliser cmd pour démarrer
            try {
              console.log('[CLOUDFLARE API] Tentative alternative avec cmd')
              const altCommand = `cmd /c start /B "" "${cloudflaredPath}" tunnel run ${tunnelName}`
              await execAsync(altCommand)
              
              await new Promise(resolve => setTimeout(resolve, 3000))
              const { stdout: checkProcesses } = await execAsync(`powershell -Command "Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Select-Object -Property Id,ProcessName | ConvertTo-Json"`)
              
              if (checkProcesses && checkProcesses.trim()) {
                message = `Tunnel ${tunnelName} démarré en arrière-plan`
                result = { tunnel: 'started', name: tunnelName }
              } else {
                throw new Error('Méthode alternative échouée' + (errorDetails ? ': ' + errorDetails.substring(0, 200) : ''))
              }
            } catch (altError: any) {
              console.error('[CLOUDFLARE API] Méthode alternative échouée:', altError)
              const finalError = errorDetails 
                ? `Impossible de démarrer cloudflared. Erreur: ${errorDetails.substring(0, 300)}`
                : startError.message || 'Impossible de démarrer cloudflared. Vérifiez que le tunnel existe et que vous êtes authentifié.'
              throw new Error(finalError)
            }
          }
        }
      } catch (error: any) {
        console.error('[CLOUDFLARE API] Erreur démarrage:', error)
        return NextResponse.json(
          { error: 'Erreur lors du démarrage: ' + error.message },
          { status: 500 }
        )
      }
    } else if (action === 'stop') {
      // Arrêter le tunnel
      try {
        // Arrêter le service si il existe
        try {
          const { stdout } = await execAsync('powershell -Command "Get-Service cloudflared -ErrorAction SilentlyContinue"')
          if (stdout && !stdout.includes('Cannot find')) {
            await execAsync('powershell -Command "Stop-Service cloudflared"')
            message = 'Service cloudflared arrêté'
            result = { service: 'stopped' }
          } else {
            // Arrêter les processus cloudflared
            await execAsync('powershell -Command "Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue"')
            message = 'Processus cloudflared arrêtés'
            result = { processes: 'stopped' }
          }
        } catch (error: any) {
          // Arrêter les processus cloudflared
          await execAsync('powershell -Command "Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue"')
          message = 'Processus cloudflared arrêtés'
          result = { processes: 'stopped' }
        }
      } catch (error: any) {
        console.error('[CLOUDFLARE API] Erreur arrêt:', error)
        return NextResponse.json(
          { error: 'Erreur lors de l\'arrêt: ' + error.message },
          { status: 500 }
        )
      }
    } else if (action === 'restart') {
      // Redémarrer le tunnel
      try {
        // Arrêter d'abord
        try {
          await execAsync('powershell -Command "Stop-Service cloudflared -ErrorAction SilentlyContinue"')
        } catch (error) {
          await execAsync('powershell -Command "Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue"')
        }
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Redémarrer
        if (tunnelName) {
          try {
            await execAsync('powershell -Command "Start-Service cloudflared"')
            message = 'Service cloudflared redémarré'
          } catch (error) {
            const cloudflaredPath = await findCloudflaredPath()
            if (!cloudflaredPath) {
              throw new Error('cloudflared non trouvé. Assurez-vous qu\'il est installé et dans le PATH.')
            }
            const command = `powershell -Command "Start-Process -FilePath '${cloudflaredPath}' -ArgumentList 'tunnel', 'run', '${tunnelName}' -WindowStyle Hidden"`
            await execAsync(command)
            message = `Tunnel ${tunnelName} redémarré`
          }
        } else {
          await execAsync('powershell -Command "Start-Service cloudflared"')
          message = 'Service cloudflared redémarré'
        }
        
        result = { status: 'restarted' }
      } catch (error: any) {
        console.error('[CLOUDFLARE API] Erreur redémarrage:', error)
        return NextResponse.json(
          { error: 'Erreur lors du redémarrage: ' + error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message,
      result,
    })
  } catch (error: any) {
    console.error('[CLOUDFLARE API] Erreur POST:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue: ' + error.message },
      { status: 500 }
    )
  }
}

