'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface FAQItem {
  id: number;
  pregunta: string;
  respuesta: string;
}

interface GlossaryTerm {
  termino: string;
  definicion: string;
}

const faqItems: FAQItem[] = [
  {
    id: 1,
    pregunta: '¿Qué es invertir?',
    respuesta: 'Invertir es poner tu dinero en activos financieros como acciones, bonos o fondos cotizados (ETFs) con la esperanza de que crezcan con el tiempo. Cuando inviertes, eres propietario de una parte de estas empresas o deudas, y puedes ganar dinero a través del crecimiento del valor y los dividendos que pagan.'
  },
  {
    id: 2,
    pregunta: '¿Es seguro?',
    respuesta: 'Orinoco Invest se asocia con un corredor de bolsa estadounidense regulado. Tus fondos van directamente a un corredor regulado, Orinoco no custodia tu dinero. Los fondos están segregados según regulaciones internacionales de protección. Además, utilizamos encriptación de nivel bancario para proteger toda tu información personal y financiera.'
  },
  {
    id: 3,
    pregunta: '¿Cómo funciona?',
    respuesta: 'El proceso es simple: primero depositas dinero en tu cuenta a través de transferencia bancaria, Zelle o PayPal, o incluso en bolívares con conversión a USD. Luego, tu dinero se asigna automáticamente a un portafolio diversificado basado en tu perfil de riesgo. Compramos ETFs (fondos cotizados) en tu nombre a través de nuestro corredor regulado. Finalmente, puedes monitorear el crecimiento de tu portafolio en tiempo real en tu panel de control.'
  },
  {
    id: 4,
    pregunta: '¿Cuánto puedo ganar o perder?',
    respuesta: 'Las ganancias y pérdidas dependen de cómo se desempeñen los mercados financieros. Históricamente, las acciones han retornado aproximadamente 10% anual a largo plazo, pero esto varía año a año. Los bonos típicamente retornan 3-5% anual. No hay garantías en la inversión, pero la diversificación reduce el riesgo. Invertir a largo plazo generalmente produce mejores resultados.'
  },
  {
    id: 5,
    pregunta: '¿Cómo retiro mi dinero?',
    respuesta: 'Puedes retirar tu dinero en cualquier momento. Simplemente solicita un retiro desde tu cuenta especificando la cantidad y el método de pago (transferencia bancaria, Zelle o PayPal). El proceso típicamente toma 3 a 5 días hábiles en completarse.'
  },
  {
    id: 6,
    pregunta: '¿Cuáles son las comisiones?',
    respuesta: 'No cobramos comisiones por depósitos, retiros o transacciones. Ofrecemos dos planes: Plan Gratis ($0) y Plan Plus ($1.99/mes). El Plan Plus incluye características avanzadas y mejor servicio al cliente. Lo que inviertes es exactamente lo que funciona para ti.'
  },
  {
    id: 7,
    pregunta: '¿Qué son los ETFs?',
    respuesta: 'Los ETFs (Fondos Cotizados en Bolsa) son canastas de muchos activos diferentes que se cotizan como una sola acción. Por ejemplo, un ETF de acciones contiene cientos de empresas diferentes. Los ETFs ofrecen diversificación automática con bajo costo, lo que es perfecto para inversores principiantes.'
  },
  {
    id: 8,
    pregunta: '¿Qué es un portafolio diversificado?',
    respuesta: 'Un portafolio diversificado significa tener tu dinero en diferentes tipos de activos y empresas, en lugar de apostar todo en una sola inversión. Si una empresa tiene dificultades, el resto de tu portafolio te protege. La diversificación reduce el riesgo mientras se mantiene el potencial de crecimiento.'
  },
  {
    id: 9,
    pregunta: '¿Puedo perder todo mi dinero?',
    respuesta: 'Es altamente improbable si inviertes a largo plazo en un portafolio diversificado. Los mercados han crecido de forma consistente durante más de 100 años. El riesgo de pérdida total es mucho mayor en inversiones concentradas (una sola acción) que en un portafolio diversificado. Si tienes un horizonte de inversión largo, el crecimiento esperado superará las fluctuaciones del mercado.'
  },
  {
    id: 10,
    pregunta: '¿Necesito experiencia para invertir?',
    respuesta: 'No necesitas ninguna experiencia. Orinoco Invest fue diseñado específicamente para principiantes. Nuestra plataforma maneja toda la compra de activos, diversificación y rebalanceo automáticamente. Solo necesitas contestar 3 preguntas sobre tu perfil de riesgo y nosotros hacemos el resto.'
  }
];

const glossaryTerms: GlossaryTerm[] = [
  {
    termino: 'Acciones',
    definicion: 'Propiedad parcial de una empresa'
  },
  {
    termino: 'Bonos',
    definicion: 'Deuda que devuelve intereses'
  },
  {
    termino: 'ETF',
    definicion: 'Canasta diversificada de activos'
  },
  {
    termino: 'Diversificación',
    definicion: 'Invertir en muchas cosas diferentes'
  },
  {
    termino: 'Portafolio',
    definicion: 'Tu colección de inversiones'
  },
  {
    termino: 'Rendimiento',
    definicion: 'Ganancia o pérdida en tu inversión'
  },
  {
    termino: 'Volatilidad',
    definicion: 'Fluctuación del precio de un activo'
  },
  {
    termino: 'Comisión',
    definicion: 'Tarifa por servicios de inversión'
  }
];

const steps = [
  {
    numero: 1,
    titulo: 'Crea tu cuenta',
    descripcion: 'Regístrate con tu correo y datos básicos'
  },
  {
    numero: 2,
    titulo: 'Completa tu evaluación',
    descripcion: 'Responde 3 preguntas sobre tu perfil de inversión'
  },
  {
    numero: 3,
    titulo: 'Deposita fondos',
    descripcion: 'Desde $5 vía crypto, Zelle o PayPal'
  },
  {
    numero: 4,
    titulo: '¡Comienza a invertir!',
    descripcion: 'Tu dinero se invierte automáticamente en tu portafolio'
  }
];

export default function AyudaPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-surface-50 pb-20 pt-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 mb-2">
            Centro de Ayuda
          </h1>
          <p className="text-lg text-surface-600">
            Respuestas a las preguntas más frecuentes
          </p>
        </div>

        {/* Getting Started Guide */}
        <Card className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-surface-900">
              Cómo empezar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step) => (
              <div
                key={step.numero}
                className="relative bg-white rounded-lg p-4 border border-surface-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                    {step.numero}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-surface-900 mb-1">
                      {step.titulo}
                    </h3>
                    <p className="text-sm text-surface-600">
                      {step.descripcion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* FAQ Accordion */}
        <Card className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-surface-900">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-2">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="border border-surface-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenFAQ(openFAQ === item.id ? null : item.id)
                  }
                  className="w-full bg-white px-4 py-4 flex items-center justify-between hover:bg-surface-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-surface-900 text-left">
                    {item.pregunta}
                  </span>
                  <svg
                    className={cn(
                      'w-5 h-5 text-brand-primary transition-transform duration-200 flex-shrink-0 ml-2',
                      openFAQ === item.id && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    openFAQ === item.id ? 'max-h-96' : 'max-h-0'
                  )}
                >
                  <div className="bg-surface-50 px-4 py-4 border-t border-surface-200">
                    <p className="text-surface-700 leading-relaxed">
                      {item.respuesta}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Glossary */}
        <Card className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-surface-900">
              Glosario de Términos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {glossaryTerms.map((term) => (
              <div
                key={term.termino}
                className="bg-surface-100 rounded-lg p-4 border border-surface-200"
              >
                <h3 className="font-semibold text-surface-900 mb-1">
                  {term.termino}
                </h3>
                <p className="text-sm text-surface-600">
                  {term.definicion}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact Section */}
        <Card className="mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-surface-900 mb-2">
              ¿Necesitas más ayuda?
            </h2>
            <p className="text-surface-600 mb-4">
              Contáctanos por email y responderemos en 24-48 horas
            </p>
            <a
              href="mailto:soporte@orinoco-invest.com"
              className="inline-block text-brand-primary font-semibold hover:underline"
            >
              soporte@orinoco-invest.com
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
