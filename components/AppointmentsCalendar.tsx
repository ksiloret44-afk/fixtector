'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Trash2 } from 'lucide-react'

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
})

interface Appointment {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  status: string
  customer: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  repair?: {
    id: string
    ticketNumber: string
  }
}

export default function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState({
    customerId: '',
    repairId: '',
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  })
  const [customers, setCustomers] = useState<any[]>([])
  const [repairs, setRepairs] = useState<any[]>([])

  useEffect(() => {
    fetchAppointments()
    fetchCustomers()
    fetchRepairs()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      // Convertir les dates string en objets Date
      const appointmentsWithDates = (data.appointments || []).map((apt: any) => ({
        ...apt,
        startDate: new Date(apt.startDate),
        endDate: new Date(apt.endDate),
      }))
      setAppointments(appointmentsWithDates)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const fetchRepairs = async () => {
    try {
      const response = await fetch('/api/repairs')
      const data = await response.json()
      setRepairs(data.repairs || [])
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end })
    setFormData({
      customerId: '',
      repairId: '',
      title: '',
      description: '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
    })
    setShowForm(true)
  }, [])

  const handleSelectEvent = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      customerId: appointment.customer.id || '',
      repairId: appointment.repair?.id || '',
      title: appointment.title,
      description: appointment.description || '',
      startDate: format(new Date(appointment.startDate), 'yyyy-MM-dd'),
      startTime: format(new Date(appointment.startDate), 'HH:mm'),
      endDate: format(new Date(appointment.endDate), 'yyyy-MM-dd'),
      endTime: format(new Date(appointment.endDate), 'HH:mm'),
    })
    setShowForm(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

      const url = selectedAppointment
        ? `/api/appointments/${selectedAppointment.id}`
        : '/api/appointments'
      const method = selectedAppointment ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: formData.customerId,
          repairId: formData.repairId || null,
          title: formData.title,
          description: formData.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setSelectedAppointment(null)
        setSelectedSlot(null)
        fetchAppointments()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAppointments()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    }
  }

  const events = appointments.map((apt) => {
    const start = apt.startDate instanceof Date ? apt.startDate : new Date(apt.startDate)
    const end = apt.endDate instanceof Date ? apt.endDate : new Date(apt.endDate)
    return {
      id: apt.id,
      title: apt.title,
      start,
      end,
      resource: apt,
    }
  })

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status
    let backgroundColor = '#3174ad'
    if (status === 'confirmed') backgroundColor = '#10b981'
    if (status === 'completed') backgroundColor = '#6b7280'
    if (status === 'cancelled') backgroundColor = '#ef4444'

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <p className="text-gray-500">Chargement du calendrier...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Rendez-vous</h2>
          <button
            onClick={() => {
              setShowForm(true)
              setSelectedAppointment(null)
              setSelectedSlot(null)
              setFormData({
                customerId: '',
                repairId: '',
                title: '',
                description: '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                startTime: '09:00',
                endDate: format(new Date(), 'yyyy-MM-dd'),
                endTime: '10:00',
              })
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </button>
        </div>

        <div style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            defaultDate={new Date()}
            defaultView="month"
            messages={{
              next: 'Suivant',
              previous: 'Précédent',
              today: "Aujourd'hui",
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Événement',
            }}
            culture="fr"
            formats={{
              dayFormat: 'dd',
              weekdayFormat: 'EEE',
              monthHeaderFormat: 'MMMM yyyy',
              dayHeaderFormat: 'EEEE dd MMMM',
              dayRangeHeaderFormat: ({ start, end }: any) => 
                `${format(start, 'dd MMM', { locale: fr })} - ${format(end, 'dd MMM', { locale: fr })}`,
            }}
          />
        </div>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Réparation (optionnel)</label>
              <select
                value={formData.repairId}
                onChange={(e) => setFormData({ ...formData, repairId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Aucune réparation</option>
                {repairs
                  .filter((r) => r.status !== 'completed' && r.status !== 'cancelled')
                  .map((repair) => (
                    <option key={repair.id} value={repair.id}>
                      #{repair.ticketNumber.slice(0, 8)} - {repair.deviceType} {repair.brand} {repair.model}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de début *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de début *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de fin *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de fin *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {selectedAppointment ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setSelectedAppointment(null)
                  setSelectedSlot(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              {selectedAppointment && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedAppointment.id)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

