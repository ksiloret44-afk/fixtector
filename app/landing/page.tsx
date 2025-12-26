'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle, Clock, Smartphone, Users, Wrench, FileText, BarChart3, Calendar, Shield, Settings, Download, Zap, Mail, MessageSquare, Star, Phone, AlertCircle, Package, Eye, Heart, HelpCircle } from 'lucide-react'
import LandingChatbot from '@/components/LandingChatbot'

function TestimonialsSection() {
  // Les avis seront chargés côté client pour éviter les problèmes de connexion DB
  return <TestimonialsClient />
}

function TestimonialsClient() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Témoignages par défaut inspirés de weqeep.com
  const defaultTestimonials = [
    {
      id: 1,
      comment: "Vraiment intuitif et un gain de temps. Retours très positifs des clients. Une note sur une échelle de 1 à 5 ? 10 !",
      companyName: "Cédric @ L'atelier du Tech",
      rating: 5
    },
    {
      id: 2,
      comment: "Les SMS, c'est un gain de temps énorme !",
      companyName: "Hugo @ Horepa",
      rating: 5
    },
    {
      id: 3,
      comment: "Plus de perte de temps à appeler les clients. Mes clients trouvent ça pro.",
      companyName: "Sébastien @ Mobil GSM",
      rating: 5
    }
  ]

  useEffect(() => {
    fetch('/api/reviews/public')
      .then(res => res.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.slice(0, 3))
        } else {
          // Utiliser les témoignages par défaut si aucun avis disponible
          setReviews(defaultTestimonials)
        }
      })
      .catch(err => {
        console.error('Erreur:', err)
        // En cas d'erreur, utiliser les témoignages par défaut
        setReviews(defaultTestimonials)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
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
                        star <= (review.rating || 5)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 mb-4 italic text-base leading-relaxed">"{review.comment}"</p>
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
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="FixTector" className="h-10" />
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#fonctionnalites" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Fonctionnalités
              </Link>
              <Link href="#temoignages" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Témoignages
              </Link>
              <Link href="#faq" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Questions fréquentes
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                href="/register"
                className="hidden sm:block text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Demander une démo
              </Link>
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

      {/* Section "Problèmes quotidiens" */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Gérez votre atelier sans prise de tête
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Chaque jour il faut gérer ...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                les demandes des clients
              </h3>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                les appels pour donner des nouvelles
              </h3>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                le suivi des réparations
              </h3>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                les pièces à commander ou vérifier
              </h3>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              <strong>Avec FixTector, fini les coups de fils qui s'enchaînent, les post-its et les fichiers compliqués.</strong>
              <br />
              <span className="text-primary-600 font-semibold">Tout est simple et à jour !</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section "Tout votre atelier sous contrôle" */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout votre atelier sous contrôle
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-8 relative overflow-hidden">
              {/* Placeholder pour visuel - à remplacer par une vraie image */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="bg-blue-600 rounded-full p-3 mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Restez à jour facilement
                </h3>
              </div>
              <ul className="space-y-3 relative z-10">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Créez vos tickets en quelques secondes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Gardez tout l'historique des réparations à portée de main</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Visualisez clairement les tâches à effectuer pour ne rien oublier</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-8 relative overflow-hidden">
              {/* Placeholder pour visuel - à remplacer par une vraie image */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="bg-green-600 rounded-full p-3 mr-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Informez vos clients sans effort
                </h3>
              </div>
              <ul className="space-y-3 relative z-10">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Des e-mails et SMS automatiques à chaque étape</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Moins de relances et d'appels, 2h de gagnées chaque semaine !</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Des clients rassurés, qui savent exactement où ça en est</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-8 relative overflow-hidden">
              {/* Placeholder pour visuel - à remplacer par une vraie image */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <div className="flex items-center mb-4 relative z-10">
                <div className="bg-purple-600 rounded-full p-3 mr-4">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Accessible où que vous soyez
                </h3>
              </div>
              <ul className="space-y-3 relative z-10">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Disponible sur smartphone, tablette, et ordinateur</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Une prise en main immédiate sans installation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Restez concentré sur vos clients, même loin du comptoir</span>
                </li>
              </ul>
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
      <section id="temoignages">
        <TestimonialsSection />
      </section>

      {/* Section "Conçu avec et pour les réparateurs" */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Conçu avec et pour les réparateurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FixTector a été pensé main dans la main avec des pros du métier.
              <br />
              Pour que la réparation ne soit plus synonyme de casse-tête, mais devienne une expérience moderne, fluide, adaptée aux attentes d'aujourd'hui et de demain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Zap className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Une prise en main rapide
              </h3>
              <p className="text-gray-600">
                sans avoir besoin d'être un expert
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Wrench className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Des fonctionnalités essentielles
              </h3>
              <p className="text-gray-600">
                pensées pour aller plus vite au quotidien
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Une équipe disponible et proche de vous
              </h3>
              <p className="text-gray-600">
                dès que vous en avez besoin
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white">
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
                Absolument ! FixTector a été pensé pour être ultra-intuitif. Aucune formation nécessaire, vous serez opérationnel en 5 minutes. L'interface est si claire que vos collaborateurs l'adopteront immédiatement. Toutes les fonctionnalités sont accessibles depuis un menu simple et organisé.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dois-je changer mes habitudes pour utiliser FixTector ?
              </h3>
              <p className="text-gray-600">
                Pas du tout ! FixTector s'adapte à VOS méthodes, pas l'inverse. Vous gardez vos habitudes, mais avec un outil qui vous fait gagner du temps sur tout ce qui est répétitif. C'est vous qui pilotez, FixTector exécute. Vous pouvez continuer à travailler comme avant, mais en étant plus efficace.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Est-ce que mes données sont en sécurité ?
              </h3>
              <p className="text-gray-600">
                Sécurité maximale garantie. Chaque entreprise a sa propre base de données isolée, vos données sont chiffrées et sauvegardées automatiquement. Vos informations sont plus sécurisées qu'un fichier Excel sur votre ordinateur. Nous respectons le RGPD et toutes les normes de sécurité en vigueur.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Y a-t-il un accompagnement si j'ai des questions ?
              </h3>
              <p className="text-gray-600">
                Oui, nous sommes là pour vous ! Documentation complète, guides vidéo, et support réactif. Nous voulons que vous réussissiez avec FixTector. Notre équipe est disponible pour répondre à toutes vos questions et vous aider à tirer le meilleur parti de l'outil.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Combien ça coûte ?
              </h3>
              <p className="text-gray-600">
                FixTector propose un essai gratuit de 24 heures pour tester toutes les fonctionnalités. Aucune carte bancaire requise. Nos tarifs sont transparents et adaptés à la taille de votre atelier. Si vous passez sur un abonnement, toutes vos données sont conservées. Contactez-nous pour connaître nos offres personnalisées.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je essayer sans risque ?
              </h3>
              <p className="text-gray-600">
                Bien sûr ! Créez votre compte gratuitement, testez toutes les fonctionnalités pendant 24 heures. Aucune carte bancaire requise, aucun engagement. Si vous décidez de passer sur un abonnement, toutes vos données sont conservées. Vous verrez par vous-même pourquoi FixTector est la meilleure solution.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment fonctionnent les notifications SMS ?
              </h3>
              <p className="text-gray-600">
                FixTector envoie automatiquement des SMS à vos clients à chaque étape importante de leur réparation (réception, diagnostic, réparation terminée, etc.). Pour utiliser cette fonctionnalité, vous devez configurer un compte SMS. Nous recommandons fortement d'utiliser le service SMS d'OVH, qui propose des forfaits adaptés aux besoins des entreprises.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment configurer les SMS avec OVH ?
              </h3>
              <p className="text-gray-600">
                C'est très simple ! Vous pouvez souscrire à un forfait SMS directement chez OVH. Une fois votre compte OVH créé, vous obtiendrez vos identifiants API (Application Key, Application Secret, Consumer Key). Il suffit ensuite de les renseigner dans les paramètres de FixTector. Les SMS seront alors envoyés automatiquement via votre compte OVH. Les tarifs OVH sont très compétitifs et adaptés à votre volume d'envoi.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je utiliser FixTector sans SMS ?
              </h3>
              <p className="text-gray-600">
                Oui, absolument ! Les SMS sont une fonctionnalité optionnelle. Vous pouvez utiliser FixTector uniquement avec les notifications par email, qui sont gratuites et illimitées. Vous pouvez également configurer votre propre adresse email d'entreprise pour que les notifications soient envoyées depuis votre domaine (par exemple : contact@votre-entreprise.fr). Les SMS sont un plus qui permet d'améliorer encore la communication avec vos clients, mais ils ne sont pas obligatoires pour utiliser FixTector.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quelles fonctionnalités sont incluses dans FixTector ?
              </h3>
              <p className="text-gray-600">
                FixTector inclut tout ce dont vous avez besoin : gestion des réparations, suivi des clients, gestion du stock et des pièces, création de devis et factures (conformes UE 2025/2026), calendrier de rendez-vous, gestion d'équipe, rapports et statistiques, notifications automatiques (email et SMS optionnel), page de suivi pour vos clients, et bien plus encore.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je utiliser FixTector sur mobile ?
              </h3>
              <p className="text-gray-600">
                Oui ! FixTector est 100% accessible depuis n'importe quel appareil : smartphone, tablette ou ordinateur. L'interface est optimisée pour le mobile, vous pouvez donc gérer votre atelier depuis n'importe où. Aucune application à télécharger, tout fonctionne directement dans votre navigateur.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Que se passe-t-il après les 24 heures d'essai ?
              </h3>
              <p className="text-gray-600">
                Après les 24 heures d'essai, vous pouvez choisir de souscrire à un abonnement pour continuer à utiliser FixTector. Toutes vos données (réparations, clients, stock, etc.) sont conservées. Si vous ne souhaitez pas continuer, vos données restent accessibles pendant une période de grâce, vous permettant de les exporter si nécessaire.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Puis-je personnaliser FixTector selon mes besoins ?
              </h3>
              <p className="text-gray-600">
                Oui ! FixTector offre de nombreuses options de personnalisation : logo de votre entreprise, thème clair/sombre, modèles de devis et factures personnalisables, notifications personnalisées, et bien plus. Vous pouvez adapter l'outil à votre image de marque et à vos processus de travail.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Comment mes clients suivent-ils leur réparation ?
              </h3>
              <p className="text-gray-600">
                Chaque client reçoit un lien unique de suivi par email ou SMS. En cliquant sur ce lien, il accède à une page dédiée qui affiche l'état de sa réparation en temps réel, les photos si vous en avez ajoutées, et les informations importantes. Plus besoin d'appeler pour avoir des nouvelles !
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
              <p className="text-sm mb-4">
                Solution complète pour la gestion de votre activité de réparation
              </p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href="tel:+3359134551" className="hover:text-white">01 59 13 45 51</a>
                </p>
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href="mailto:contact@fixtector.com" className="hover:text-white">contact@fixtector.com</a>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#fonctionnalites" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link href="/register" className="hover:text-white">Essai gratuit</Link></li>
                <li><Link href="/register" className="hover:text-white">Demander une démo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Se connecter</Link></li>
                <li><Link href="/register" className="hover:text-white">S'inscrire</Link></li>
                <li><Link href="/register" className="hover:text-white">Recommander un réparateur</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">Conditions générales d'utilisation</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
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

