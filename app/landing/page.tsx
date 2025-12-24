'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Smartphone, Users, Wrench, FileText, BarChart3, Calendar, Shield, Settings, Download, Zap, Mail, MessageSquare, Star } from 'lucide-react'
import LandingChatbot from '@/components/LandingChatbot'

function TestimonialsSection() {
  // Les avis seront chargés côté client pour éviter les problèmes de connexion DB
  return <TestimonialsClient />
}

function TestimonialsClient() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reviews/public')
      .then(res => res.json())
      .then(data => {
        if (data.reviews) {
          setReviews(data.reviews.slice(0, 3))
        }
      })
      .catch(err => console.error('Erreur:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading || reviews.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ils en parlent mieux que nous
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>
              )}
              <p className="text-sm font-semibold text-gray-900">
                — {review.companyName || 'Entreprise'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

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
              La solution de gestion la plus complète pour réparateurs
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              FixTector transforme votre atelier en entreprise moderne. Gagnez des heures chaque jour avec une gestion automatisée, des clients satisfaits et une croissance maîtrisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?trial=true"
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
                Gagnez 2 heures par jour minimum
              </h3>
              <p className="text-gray-600">
                Fini les appels répétitifs. FixTector automatise tout et vous laisse vous concentrer sur votre passion : réparer.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Vos clients vous recommandent
              </h3>
              <p className="text-gray-600">
                Transparence totale, notifications automatiques, suivi en temps réel. Vos clients adorent et reviennent.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Prenez les bonnes décisions
              </h3>
              <p className="text-gray-600">
                Visualisez votre rentabilité, identifiez vos meilleurs clients, optimisez vos stocks. Tout en un coup d'œil.
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
              Tout ce dont vous avez besoin, rien de superflu
            </h2>
            <p className="text-xl text-gray-600">
              Une solution complète conçue par des réparateurs, pour des réparateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Zap className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Création de tickets ultra-rapide
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Saisie express : 30 secondes pour créer un ticket complet</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Historique complet de chaque appareil et client en un clic</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Vue d'ensemble intelligente : voyez d'un coup d'œil ce qui attend</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Mail className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Communication automatique intelligente
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">E-mails et SMS envoyés automatiquement à chaque changement de statut</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Réduisez vos appels de 80% : vos clients sont toujours informés</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Page de suivi personnalisée : vos clients suivent leur réparation en direct</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Smartphone className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Travaillez depuis n'importe où
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">100% cloud : accédez à vos données sur mobile, tablette ou PC</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Aucune installation requise : démarrez en 2 minutes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Interface optimisée mobile : gérez votre atelier depuis votre smartphone</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <Wrench className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    La solution la plus complète du marché
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Gestion complète : réparations, clients, stock, pièces, rendez-vous, garanties</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Devis et factures conformes UE 2025/2026 avec facturation électronique UBL 2.1</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-gray-700">Calendrier intégré, gestion d'équipe, rapports avancés et bien plus encore</span>
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
              Une boîte à outils complète pour votre atelier
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
      <TestimonialsSection />

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
                Est-ce vraiment simple à utiliser ?
              </h3>
              <p className="text-gray-600">
                Absolument ! FixTector a été pensé pour être ultra-intuitif. Aucune formation nécessaire, vous serez opérationnel en 5 minutes. L'interface est si claire que vos collaborateurs l'adopteront immédiatement.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dois-je changer ma façon de travailler ?
              </h3>
              <p className="text-gray-600">
                Pas du tout ! FixTector s'adapte à VOS méthodes, pas l'inverse. Vous gardez vos habitudes, mais avec un outil qui vous fait gagner du temps sur tout ce qui est répétitif. C'est vous qui pilotez, FixTector exécute.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mes données sont-elles vraiment sécurisées ?
              </h3>
              <p className="text-gray-600">
                Sécurité maximale garantie. Chaque entreprise a sa propre base de données isolée, vos données sont chiffrées et sauvegardées automatiquement. Vos informations sont plus sécurisées qu'un fichier Excel sur votre ordinateur.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Y a-t-il un support si j'ai besoin d'aide ?
              </h3>
              <p className="text-gray-600">
                Oui, nous sommes là pour vous ! Documentation complète, guides vidéo, et support réactif. Nous voulons que vous réussissiez avec FixTector.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je tester avant de m'engager ?
              </h3>
              <p className="text-gray-600">
                Bien sûr ! Créez votre compte gratuitement, testez toutes les fonctionnalités sans limite de temps. Aucune carte bancaire requise, aucun engagement. Vous verrez par vous-même pourquoi FixTector est la meilleure solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Rejoignez les réparateurs qui ont choisi l'excellence
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            FixTector : la solution #1 pour transformer votre atelier en entreprise moderne et rentable
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

      {/* Chatbot widget pour la page d'accueil */}
      <LandingChatbot />
    </div>
  )
}

