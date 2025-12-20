import Link from 'next/link'
import { CheckCircle, Clock, Smartphone, Users, Wrench, FileText, BarChart3, Calendar, Shield, Settings, Download, Zap, Mail, MessageSquare } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="FixTector" className="h-10" />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Démarrer l'essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Gérez vos réparations. Simplement.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              FixTector vous aide à suivre vos réparations, prévenir vos clients et gagner du temps, sans changer vos habitudes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-primary-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Démarrer l'essai gratuit
              </Link>
              <Link
                href="#fonctionnalites"
                className="bg-white text-primary-600 px-8 py-3 rounded-md text-lg font-medium border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                Découvrir les fonctionnalités
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Moins d'interruptions, plus de temps pour réparer
              </h3>
              <p className="text-gray-600">
                Automatisez vos notifications et concentrez-vous sur l'essentiel
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Une meilleure expérience pour vos clients
              </h3>
              <p className="text-gray-600">
                Informez vos clients automatiquement à chaque étape
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Un outil simple pour piloter votre activité
              </h3>
              <p className="text-gray-600">
                Tableaux de bord, statistiques et rapports en temps réel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout votre atelier sous contrôle
            </h2>
            <p className="text-xl text-gray-600">
              Des fonctionnalités pensées pour les réparateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Zap className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Restez à jour facilement
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Créez vos tickets en quelques secondes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Gardez tout l'historique des réparations à portée de main</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Visualisez clairement les tâches à effectuer</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Mail className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Informez vos clients sans effort
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">E-mails et SMS automatiques à chaque étape</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Moins de relances et d'appels, 2h de gagnées chaque semaine !</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Des clients rassurés, qui savent exactement où ça en est</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Smartphone className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Accessible où que vous soyez
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Disponible sur smartphone, tablette, et ordinateur</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Une prise en main immédiate sans installation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Restez concentré sur vos clients, même loin du comptoir</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Wrench className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Fonctionnalités complètes
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Gestion des réparations, clients, stock et pièces</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Devis et factures avec conformité européenne</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Calendrier des rendez-vous et suivi des garanties</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Toutes les fonctionnalités dont vous avez besoin
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <Wrench className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Réparations</p>
            </div>
            <div className="text-center p-4">
              <Users className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Clients</p>
            </div>
            <div className="text-center p-4">
              <FileText className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Devis & Factures</p>
            </div>
            <div className="text-center p-4">
              <BarChart3 className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Statistiques</p>
            </div>
            <div className="text-center p-4">
              <Calendar className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Rendez-vous</p>
            </div>
            <div className="text-center p-4">
              <MessageSquare className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Notifications</p>
            </div>
            <div className="text-center p-4">
              <Shield className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Sécurité</p>
            </div>
            <div className="text-center p-4">
              <Settings className="h-10 w-10 text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Personnalisation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ils en parlent mieux que nous
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Vraiment intuitif et un gain de temps. Retours très positifs des clients. Une note sur une échelle de 1 à 5 ? 10 !"
              </p>
              <p className="text-sm font-semibold text-gray-900">
                — Cédric @ L'atelier du Tech
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Les SMS, c'est un gain de temps énorme !"
              </p>
              <p className="text-sm font-semibold text-gray-900">
                — Hugo @ Horepa
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {'★'.repeat(5)}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Plus de perte de temps à appeler les clients. Mes clients trouvent ça pro."
              </p>
              <p className="text-sm font-semibold text-gray-900">
                — Sébastien @ Mobil GSM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Est-ce simple à utiliser ?
              </h3>
              <p className="text-gray-600">
                Oui, FixTector a été conçu pour être intuitif. Vous pouvez commencer à l'utiliser en quelques minutes, sans formation.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dois-je changer mes habitudes pour utiliser FixTector ?
              </h3>
              <p className="text-gray-600">
                Non, FixTector s'adapte à votre façon de travailler. Vous continuez à gérer vos réparations comme avant, mais avec plus d'efficacité.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Est-ce que mes données sont en sécurité ?
              </h3>
              <p className="text-gray-600">
                Absolument. Vos données sont chiffrées et sauvegardées régulièrement. Chaque entreprise a sa propre base de données isolée.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Y a-t-il un accompagnement si j'ai des questions ?
              </h3>
              <p className="text-gray-600">
                Oui, nous sommes là pour vous aider. Consultez la documentation ou contactez notre support.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je essayer sans risque ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez créer un compte gratuitement et tester toutes les fonctionnalités sans engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à gagner du temps chaque jour ?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Avec FixTector, réparez en toute simplicité
          </p>
          <Link
            href="/register"
            className="bg-white text-primary-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Démarrer l'essai gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/logo.svg" alt="FixTector" className="h-8 mb-4 filter brightness-0 invert" />
              <p className="text-sm">
                Solution complète pour la gestion de votre activité de réparation
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#fonctionnalites" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link href="/register" className="hover:text-white">Essai gratuit</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Se connecter</Link></li>
                <li><Link href="/register" className="hover:text-white">S'inscrire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Conditions générales</a></li>
                <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>FixTector - 2025 Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

