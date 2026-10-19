// Catalog content shown in the checkout (descriptions, inclusions, conditions). Prices live in the
// database (public.passes); this file only describes the products. Sources: /tickets, /whale-tank and
// partnerships/data.json as published on 2026-10-18. Pending: Tere's master catalog (Drive).

export const CATEGORIES = {
  "festival": {
    "en": "Festival passes",
    "es": "Pases del festival"
  },
  "hotel": {
    "en": "Hotel & stay",
    "es": "Hotel y hospedaje"
  },
  "whale-tank": {
    "en": "Whale Tank",
    "es": "Whale Tank"
  },
  "sponsorship": {
    "en": "Sponsorships",
    "es": "Patrocinios"
  },
  "residency": {
    "en": "Residencies",
    "es": "Residencias"
  },
  "other": {
    "en": "Other",
    "es": "Otros"
  },
  "test": {
    "en": "Test",
    "es": "Prueba"
  }
};

export const PRODUCTS = {
  "general-access": {
    "art": "/assets/tickets/general-access-sm.webp",
    "colors": [
      "#FF6A2B",
      "#6B4BFF"
    ],
    "tagline": {
      "en": "4-Day Pass · Most popular",
      "es": "Pase 4 días · El más elegido"
    },
    "description": {
      "en": "The complete four-day festival for founders, builders, creators and curious minds.",
      "es": "El festival completo de cuatro días para founders, builders, creadores y mentes curiosas."
    },
    "includes": [
      {
        "en": "Festival access, December 9–12 (four days)",
        "es": "Acceso al festival, 9–12 de diciembre (cuatro días)"
      },
      {
        "en": "Main stage, talks and panels",
        "es": "Escenario principal, charlas y paneles"
      },
      {
        "en": "AI, blockchain, digital assets & new economy; Future Cities, VC & entrepreneurship",
        "es": "IA, blockchain, activos digitales y nueva economía; Future Cities, VC y emprendimiento"
      },
      {
        "en": "Whale Tank public programming and final",
        "es": "Programación pública y final de Whale Tank"
      },
      {
        "en": "Open festival networking and the AI-powered networking platform, when enabled",
        "es": "Networking abierto y plataforma de networking con IA, cuando esté habilitada"
      },
      {
        "en": "Full Tulum Party, subject to event conditions",
        "es": "Full Tulum Party, sujeta a condiciones del evento"
      }
    ],
    "excludes": [
      {
        "en": "VIP / Executive hospitality area",
        "es": "Área de hospitalidad VIP / Executive"
      },
      {
        "en": "Tulum Lujo Descalzo Cocktail Gala",
        "es": "Tulum Lujo Descalzo Cocktail Gala"
      },
      {
        "en": "Hotel, breakfast and transfers",
        "es": "Hotel, desayuno y traslados"
      }
    ],
    "conditions": [
      {
        "en": "Price in USD with fees included; charged in MXN at the rate shown.",
        "es": "Precio en USD con cargos incluidos; se cobra en MXN al tipo de cambio indicado."
      },
      {
        "en": "One QR ticket per person; show it at the entrance.",
        "es": "Un boleto con QR por persona; preséntalo en el acceso."
      }
    ]
  },
  "executive-pass": {
    "art": "/assets/tickets/executive-pass-sm.webp",
    "colors": [
      "#FFC424",
      "#3C4BFF"
    ],
    "tagline": {
      "en": "VIP experience",
      "es": "Experiencia VIP"
    },
    "description": {
      "en": "The VIP festival experience for executives, investors and business leaders, with the hospitality area and the Cocktail Gala.",
      "es": "La experiencia VIP del festival para ejecutivos, inversionistas y líderes empresariales, con área de hospitalidad y Cocktail Gala."
    },
    "includes": [
      {
        "en": "Everything in General Access",
        "es": "Todo lo de General Access"
      },
      {
        "en": "VIP / Executive hospitality area",
        "es": "Área de hospitalidad VIP / Executive"
      },
      {
        "en": "Tulum Lujo Descalzo Cocktail Gala",
        "es": "Tulum Lujo Descalzo Cocktail Gala"
      },
      {
        "en": "Executive community experiences and Executive networking access",
        "es": "Experiencias de la comunidad Executive y acceso de networking Executive"
      },
      {
        "en": "VIP access to the Full Tulum Party",
        "es": "Acceso VIP a la Full Tulum Party"
      }
    ],
    "excludes": [
      {
        "en": "Accommodation: add the Hotel Upgrade separately",
        "es": "Hospedaje: agrega el Hotel Upgrade por separado"
      }
    ],
    "conditions": [
      {
        "en": "USD 1,500 + fees (USD 1,590 total); charged in MXN at the rate shown.",
        "es": "USD 1,500 + cargos (USD 1,590 total); se cobra en MXN al tipo de cambio indicado."
      },
      {
        "en": "One QR ticket per person.",
        "es": "Un boleto con QR por persona."
      }
    ]
  },
  "community-access": {
    "art": "/assets/tickets/community-access-sm.webp",
    "colors": [
      "#4BFF5A",
      "#5B3BFF"
    ],
    "tagline": {
      "en": "Tulum residents · 50% off",
      "es": "Residentes de Tulum · 50% de descuento"
    },
    "description": {
      "en": "Four-day access reserved for the local Tulum community, at 50% of the General Access rate.",
      "es": "Acceso de cuatro días reservado para la comunidad local de Tulum, al 50% de la tarifa General Access."
    },
    "includes": [
      {
        "en": "Four-day festival access",
        "es": "Acceso de cuatro días al festival"
      },
      {
        "en": "Talks, networking and community experience",
        "es": "Charlas, networking y experiencia de comunidad"
      },
      {
        "en": "Festival parties",
        "es": "Fiestas del festival"
      }
    ],
    "excludes": [
      {
        "en": "VIP / Executive benefits",
        "es": "Beneficios VIP / Executive"
      },
      {
        "en": "Hotel, breakfast and transfers",
        "es": "Hotel, desayuno y traslados"
      }
    ],
    "conditions": [
      {
        "en": "A valid local ID or proof of residency is required at entry; otherwise the difference to General Access applies.",
        "es": "Se requiere identificación local o comprobante de residencia en el acceso; de lo contrario aplica la diferencia con General Access."
      }
    ]
  },
  "hotel-upgrade": {
    "colors": [
      "#25B8FF",
      "#FF3374"
    ],
    "tagline": {
      "en": "4 nights · Dec 9–13",
      "es": "4 noches · 9–13 dic"
    },
    "description": {
      "en": "Four nights at a partner hotel with breakfast and scheduled transfers. Choose your hotel from the official partner catalog.",
      "es": "Cuatro noches en un hotel aliado con desayuno y traslados programados. Elige tu hotel del catálogo oficial de hoteles aliados."
    },
    "includes": [
      {
        "en": "4 nights · check-in Dec 9 · check-out Dec 13",
        "es": "4 noches · check-in 9 dic · check-out 13 dic"
      },
      {
        "en": "Daily breakfast for registered hotel guests",
        "es": "Desayuno diario para huéspedes registrados"
      },
      {
        "en": "Scheduled transfers",
        "es": "Traslados programados"
      },
      {
        "en": "Partner hotels: Moxy by Marriott, Motto by Hilton, IKAL Hotel, Papaya Playa, Bardo, Milam, Ahau, Kan",
        "es": "Hoteles aliados: Moxy by Marriott, Motto by Hilton, IKAL Hotel, Papaya Playa, Bardo, Milam, Ahau, Kan"
      }
    ],
    "excludes": [
      {
        "en": "Festival admission: buy your pass separately",
        "es": "Acceso al festival: compra tu pase por separado"
      },
      {
        "en": "Extra nights and private services (quoted separately)",
        "es": "Noches extra y servicios privados (se cotizan aparte)"
      }
    ],
    "conditions": [
      {
        "en": "USD 1,500 + fees (USD 1,590 total). Hotel assignment subject to availability; our team confirms it by email.",
        "es": "USD 1,500 + cargos (USD 1,590 total). Asignación de hotel sujeta a disponibilidad; nuestro equipo la confirma por correo."
      }
    ]
  },
  "hotel-second-guest": {
    "colors": [
      "#FF3374",
      "#25B8FF"
    ],
    "tagline": {
      "en": "Additional guest",
      "es": "Huésped adicional"
    },
    "description": {
      "en": "Second guest sharing an eligible Hotel Upgrade room.",
      "es": "Segundo huésped en una habitación elegible compartida del Hotel Upgrade."
    },
    "includes": [
      {
        "en": "Shared room for the 4 nights of the Hotel Upgrade",
        "es": "Habitación compartida durante las 4 noches del Hotel Upgrade"
      },
      {
        "en": "Daily breakfast and scheduled transfers",
        "es": "Desayuno diario y traslados programados"
      }
    ],
    "excludes": [
      {
        "en": "Festival admission",
        "es": "Acceso al festival"
      },
      {
        "en": "The Hotel Upgrade itself: the main guest buys it",
        "es": "El Hotel Upgrade en sí: lo compra el huésped principal"
      }
    ],
    "conditions": [
      {
        "en": "USD 720 + fees (USD 770.40 total). Only valid together with a Hotel Upgrade.",
        "es": "USD 720 + cargos (USD 770.40 total). Solo válido junto con un Hotel Upgrade."
      }
    ]
  },
  "whale-tank-founder": {
    "colors": [
      "#1FC6FF",
      "#6B4BFF"
    ],
    "art": "/assets/whale-tank-hero.webp",
    "tagline": {
      "en": "Selected startups · principal participant",
      "es": "Startups seleccionadas · participante principal"
    },
    "description": {
      "en": "Founder Full Experience for startups selected for Whale Tank. Full program value USD 5,800; the USD 3,300 acceleration scholarship is covered by the Main Sponsor / Program Partners.",
      "es": "Founder Full Experience para startups seleccionadas en Whale Tank. Valor total del programa USD 5,800; la beca de aceleración de USD 3,300 la cubren el Main Sponsor y los Program Partners."
    },
    "includes": [
      {
        "en": "Private accommodation with breakfast",
        "es": "Hospedaje privado con desayuno"
      },
      {
        "en": "Round-trip airport transfers to/from Tulum and transfers between venues",
        "es": "Traslados aeropuerto–Tulum ida y vuelta y entre sedes"
      },
      {
        "en": "Admission to Tulum Innovation Fest and the Whale Tank program",
        "es": "Acceso a Tulum Innovation Fest y al programa Whale Tank"
      },
      {
        "en": "Founder Accelerator Program, mentorship, pitch training and investment readiness (100% scholarship)",
        "es": "Founder Accelerator Program, mentorías, pitch training e investment readiness (beca del 100%)"
      },
      {
        "en": "Investor presentations and the chance to reach the Whale Tank Final Showcase",
        "es": "Presentaciones ante inversionistas y oportunidad de llegar al Whale Tank Final Showcase"
      },
      {
        "en": "Complimentary VIP upgrade (value USD 1,500): VIP area, Cocktail Gala, Executive networking",
        "es": "Upgrade VIP de regalo (valor USD 1,500): área VIP, Cocktail Gala, networking Executive"
      },
      {
        "en": "Welcome Kit and onsite coordination",
        "es": "Welcome Kit y coordinación en sitio"
      }
    ],
    "excludes": [
      {
        "en": "Flights to Cancún / Tulum",
        "es": "Vuelos a Cancún / Tulum"
      },
      {
        "en": "Additional team members (USD 1,000 per person)",
        "es": "Miembros adicionales del equipo (USD 1,000 por persona)"
      }
    ],
    "conditions": [
      {
        "en": "Only for startups selected by the Whale Tank committee.",
        "es": "Solo para startups seleccionadas por el comité de Whale Tank."
      },
      {
        "en": "Full terms on the Whale Tank page: tuluminnovationfest.com/whale-tank#terms",
        "es": "Términos completos en la página de Whale Tank: tuluminnovationfest.com/whale-tank#terms"
      }
    ]
  },
  "whale-tank-team-member": {
    "colors": [
      "#6B4BFF",
      "#1FC6FF"
    ],
    "tagline": {
      "en": "From the second member of the same startup",
      "es": "Desde el segundo integrante de la misma startup"
    },
    "description": {
      "en": "Additional team member for a selected Whale Tank startup. The fee applies per person, even when sharing a room.",
      "es": "Integrante adicional de una startup seleccionada en Whale Tank. La tarifa aplica por persona, aunque compartan habitación."
    },
    "includes": [
      {
        "en": "Shared accommodation with the principal participant, with breakfast",
        "es": "Hospedaje compartido con el participante principal, con desayuno"
      },
      {
        "en": "Airport and venue transfers",
        "es": "Traslados de aeropuerto y entre sedes"
      },
      {
        "en": "Festival and Whale Tank access",
        "es": "Acceso al festival y a Whale Tank"
      },
      {
        "en": "Team acceleration and mentorship activities",
        "es": "Actividades de aceleración y mentoría para equipos"
      },
      {
        "en": "Welcome Kit and onsite coordination",
        "es": "Welcome Kit y coordinación en sitio"
      }
    ],
    "excludes": [
      {
        "en": "Flights",
        "es": "Vuelos"
      },
      {
        "en": "VIP upgrade (only for the principal participant)",
        "es": "Upgrade VIP (solo para el participante principal)"
      }
    ],
    "conditions": [
      {
        "en": "Only together with a paid Founder Full Experience of the same startup.",
        "es": "Solo junto con un Founder Full Experience pagado de la misma startup."
      }
    ]
  },
  "tif-test": {
    "colors": [
      "#888888",
      "#444444"
    ],
    "tagline": {
      "en": "Internal test",
      "es": "Prueba interna"
    },
    "description": {
      "en": "Internal payment test. Not a real pass.",
      "es": "Prueba interna de pago. No es un pase real."
    },
    "includes": [],
    "excludes": [],
    "conditions": []
  },
  "sponsor-event-supporter": {
    "colors": [
      "#ff6b2c",
      "#00080B"
    ],
    "tagline": {
      "en": "Support the festival community",
      "es": "Apoya a la comunidad del festival"
    },
    "description": {
      "en": "Event Supporter partnership package for Tulum Innovation Fest 2026. Our partnerships team contacts you after payment to coordinate the benefits.",
      "es": "Paquete de patrocinio Event Supporter para Tulum Innovation Fest 2026. Después del pago, nuestro equipo de alianzas te contacta para coordinar los beneficios."
    },
    "includes": [
      {
        "en": "General Admission passes: 2",
        "es": "Pases General Admission: 2"
      },
      {
        "en": "VIP / Executive passes: 2",
        "es": "Pases VIP / Executive: 2"
      },
      {
        "en": "Website & digital visibility: Partner logo, directory and selected materials",
        "es": "Visibilidad web y digital: Logo de partner, directorio y materiales seleccionados"
      },
      {
        "en": "Networking & hospitality: General Admission open networking",
        "es": "Networking y hospitalidad: Networking abierto de General Admission"
      },
      {
        "en": "Communications & media: Selected recognition in official channels",
        "es": "Comunicación y medios: Reconocimiento seleccionado en canales oficiales"
      },
      {
        "en": "Post-event reporting: Basic visibility and participation report",
        "es": "Reporte posterior al evento: Reporte básico de visibilidad y participación"
      }
    ],
    "excludes": [
      {
        "en": "On-site branding",
        "es": "Branding en sitio"
      },
      {
        "en": "Brand activation",
        "es": "Activación de marca"
      },
      {
        "en": "Program association",
        "es": "Asociación con el programa"
      },
      {
        "en": "Hotel package",
        "es": "Paquete de hotel"
      },
      {
        "en": "Naming / category exclusivity",
        "es": "Naming / exclusividad de categoría"
      }
    ],
    "conditions": [
      {
        "en": "Price in USD + VAT (16%); the VAT is added at checkout. Accommodation is not included.",
        "es": "Precio en USD + IVA (16%); el IVA se suma en el checkout. No incluye hospedaje."
      },
      {
        "en": "Benefits, deliverables and dates are confirmed in the partnership agreement.",
        "es": "Beneficios, entregables y fechas se confirman en el acuerdo de patrocinio."
      },
      {
        "en": "Need an invoice (CFDI)? Write to innovation@likegroup.io after paying.",
        "es": "¿Necesitas factura (CFDI)? Escribe a innovation@likegroup.io después de pagar."
      }
    ]
  },
  "sponsor-touchpoint-partner": {
    "colors": [
      "#79ff47",
      "#00080B"
    ],
    "tagline": {
      "en": "One useful brand touchpoint",
      "es": "Un punto de contacto útil para tu marca"
    },
    "description": {
      "en": "Touchpoint Partner partnership package for Tulum Innovation Fest 2026. Our partnerships team contacts you after payment to coordinate the benefits.",
      "es": "Paquete de patrocinio Touchpoint Partner para Tulum Innovation Fest 2026. Después del pago, nuestro equipo de alianzas te contacta para coordinar los beneficios."
    },
    "includes": [
      {
        "en": "General Admission passes: 4",
        "es": "Pases General Admission: 4"
      },
      {
        "en": "VIP / Executive passes: 2",
        "es": "Pases VIP / Executive: 2"
      },
      {
        "en": "Website & digital visibility: Event Supporter visibility benefits",
        "es": "Visibilidad web y digital: Beneficios de visibilidad de Event Supporter"
      },
      {
        "en": "On-site branding: One selected brand touchpoint",
        "es": "Branding en sitio: Un punto de contacto de marca seleccionado"
      },
      {
        "en": "Brand activation: One small activation, subject to feasibility",
        "es": "Activación de marca: Una activación pequeña sujeta a viabilidad"
      },
      {
        "en": "Program association: Welcome, hydration, charging or similar",
        "es": "Asociación con el programa: Bienvenida, hidratación, carga o similar"
      },
      {
        "en": "Networking & hospitality: General Admission open networking",
        "es": "Networking y hospitalidad: Networking abierto de General Admission"
      },
      {
        "en": "Communications & media: 1 social acknowledgment and basic photography",
        "es": "Comunicación y medios: 1 reconocimiento en redes y fotografía básica"
      },
      {
        "en": "Post-event reporting: Basic activation and visibility report",
        "es": "Reporte posterior al evento: Reporte básico de activación y visibilidad"
      }
    ],
    "excludes": [
      {
        "en": "Hotel package",
        "es": "Paquete de hotel"
      },
      {
        "en": "Naming / category exclusivity",
        "es": "Naming / exclusividad de categoría"
      }
    ],
    "conditions": [
      {
        "en": "Price in USD + VAT (16%); the VAT is added at checkout. Accommodation is not included.",
        "es": "Precio en USD + IVA (16%); el IVA se suma en el checkout. No incluye hospedaje."
      },
      {
        "en": "Benefits, deliverables and dates are confirmed in the partnership agreement.",
        "es": "Beneficios, entregables y fechas se confirman en el acuerdo de patrocinio."
      },
      {
        "en": "Need an invoice (CFDI)? Write to innovation@likegroup.io after paying.",
        "es": "¿Necesitas factura (CFDI)? Escribe a innovation@likegroup.io después de pagar."
      }
    ]
  },
  "sponsor-ecosystem-partner": {
    "colors": [
      "#cf53fa",
      "#00080B"
    ],
    "tagline": {
      "en": "Integrate into the festival program",
      "es": "Intégrate al programa del festival"
    },
    "description": {
      "en": "Ecosystem Partner partnership package for Tulum Innovation Fest 2026. Our partnerships team contacts you after payment to coordinate the benefits.",
      "es": "Paquete de patrocinio Ecosystem Partner para Tulum Innovation Fest 2026. Después del pago, nuestro equipo de alianzas te contacta para coordinar los beneficios."
    },
    "includes": [
      {
        "en": "General Admission passes: 4",
        "es": "Pases General Admission: 4"
      },
      {
        "en": "VIP / Executive passes: 3",
        "es": "Pases VIP / Executive: 3"
      },
      {
        "en": "Website & digital visibility: Website, program and partner communications",
        "es": "Visibilidad web y digital: Sitio web, programa y comunicaciones de partners"
      },
      {
        "en": "On-site branding: Agreed festival locations",
        "es": "Branding en sitio: Ubicaciones del festival acordadas"
      },
      {
        "en": "Brand activation: Possible integration in an existing activity",
        "es": "Activación de marca: Posible integración en una actividad existente"
      },
      {
        "en": "Program association: Existing activity subject to approval",
        "es": "Asociación con el programa: Actividad existente sujeta a aprobación"
      },
      {
        "en": "Networking & hospitality: Open networking and agreed connections",
        "es": "Networking y hospitalidad: Networking abierto y conexiones acordadas"
      },
      {
        "en": "Communications & media: Agreed communications and media plan",
        "es": "Comunicación y medios: Comunicaciones y plan de medios acordados"
      },
      {
        "en": "Post-event reporting: Brand presence and participation report",
        "es": "Reporte posterior al evento: Reporte de presencia de marca y participación"
      }
    ],
    "excludes": [
      {
        "en": "Hotel package",
        "es": "Paquete de hotel"
      },
      {
        "en": "Naming / category exclusivity",
        "es": "Naming / exclusividad de categoría"
      }
    ],
    "conditions": [
      {
        "en": "Price in USD + VAT (16%); the VAT is added at checkout. Accommodation is not included.",
        "es": "Precio en USD + IVA (16%); el IVA se suma en el checkout. No incluye hospedaje."
      },
      {
        "en": "Benefits, deliverables and dates are confirmed in the partnership agreement.",
        "es": "Beneficios, entregables y fechas se confirman en el acuerdo de patrocinio."
      },
      {
        "en": "Need an invoice (CFDI)? Write to innovation@likegroup.io after paying.",
        "es": "¿Necesitas factura (CFDI)? Escribe a innovation@likegroup.io después de pagar."
      }
    ]
  },
  "sponsor-experience-partner": {
    "colors": [
      "#1fc6ff",
      "#00080B"
    ],
    "tagline": {
      "en": "Activate one selected experience",
      "es": "Activa una experiencia seleccionada"
    },
    "description": {
      "en": "Experience Partner partnership package for Tulum Innovation Fest 2026. Our partnerships team contacts you after payment to coordinate the benefits.",
      "es": "Paquete de patrocinio Experience Partner para Tulum Innovation Fest 2026. Después del pago, nuestro equipo de alianzas te contacta para coordinar los beneficios."
    },
    "includes": [
      {
        "en": "General Admission passes: 6",
        "es": "Pases General Admission: 6"
      },
      {
        "en": "VIP / Executive passes: 4",
        "es": "Pases VIP / Executive: 4"
      },
      {
        "en": "Website & digital visibility: Ecosystem benefits plus experience materials",
        "es": "Visibilidad web y digital: Beneficios de Ecosystem más materiales de la experiencia"
      },
      {
        "en": "On-site branding: Branding for one selected experience",
        "es": "Branding en sitio: Branding de una experiencia seleccionada"
      },
      {
        "en": "Brand activation: One dedicated experience activation",
        "es": "Activación de marca: Una activación dedicada de experiencia"
      },
      {
        "en": "Program association: One selected experience or activity",
        "es": "Asociación con el programa: Una experiencia o actividad seleccionada"
      },
      {
        "en": "Networking & hospitality: 1 Executive guest: program, Tulum Lujo Descalzo Cocktail Gala and hospitality",
        "es": "Networking y hospitalidad: 1 invitado Executive: programa, Tulum Lujo Descalzo Cocktail Gala y hospitalidad"
      },
      {
        "en": "Communications & media: Experience communications and media plan",
        "es": "Comunicación y medios: Comunicaciones de la experiencia y plan de medios"
      },
      {
        "en": "Post-event reporting: Activation and available participation metrics",
        "es": "Reporte posterior al evento: Métricas disponibles de activación y participación"
      },
      {
        "en": "Hotel package: Optional add-on for VIP / Executive",
        "es": "Paquete de hotel: Complemento opcional para VIP / Executive"
      }
    ],
    "excludes": [
      {
        "en": "Naming / category exclusivity",
        "es": "Naming / exclusividad de categoría"
      }
    ],
    "conditions": [
      {
        "en": "Price in USD + VAT (16%); the VAT is added at checkout. Accommodation is not included.",
        "es": "Precio en USD + IVA (16%); el IVA se suma en el checkout. No incluye hospedaje."
      },
      {
        "en": "Benefits, deliverables and dates are confirmed in the partnership agreement.",
        "es": "Beneficios, entregables y fechas se confirman en el acuerdo de patrocinio."
      },
      {
        "en": "Need an invoice (CFDI)? Write to innovation@likegroup.io after paying.",
        "es": "¿Necesitas factura (CFDI)? Escribe a innovation@likegroup.io después de pagar."
      }
    ]
  },
  "sponsor-strategic-partner": {
    "colors": [
      "#ff426f",
      "#00080B"
    ],
    "tagline": {
      "en": "Build an agreed strategic presence",
      "es": "Define una presencia estratégica"
    },
    "description": {
      "en": "Strategic Partner partnership package for Tulum Innovation Fest 2026. Our partnerships team contacts you after payment to coordinate the benefits.",
      "es": "Paquete de patrocinio Strategic Partner para Tulum Innovation Fest 2026. Después del pago, nuestro equipo de alianzas te contacta para coordinar los beneficios."
    },
    "includes": [
      {
        "en": "General Admission passes: 10",
        "es": "Pases General Admission: 10"
      },
      {
        "en": "VIP / Executive passes: 5",
        "es": "Pases VIP / Executive: 5"
      },
      {
        "en": "Website & digital visibility: Priority placement in agreed materials",
        "es": "Visibilidad web y digital: Ubicación prioritaria en materiales acordados"
      },
      {
        "en": "On-site branding: Priority branding at selected locations",
        "es": "Branding en sitio: Branding prioritario en ubicaciones seleccionadas"
      },
      {
        "en": "Brand activation: Strategic activation with agreed scope",
        "es": "Activación de marca: Activación estratégica con alcance acordado"
      },
      {
        "en": "Program association: Potential theme or industry vertical",
        "es": "Asociación con el programa: Posible tema o vertical de industria"
      },
      {
        "en": "Networking & hospitality: 2 Executive guests and requested introductions*",
        "es": "Networking y hospitalidad: 2 invitados Executive y presentaciones solicitadas*"
      },
      {
        "en": "Communications & media: Featured communications and media plan",
        "es": "Comunicación y medios: Comunicaciones destacadas y plan de medios"
      },
      {
        "en": "Post-event reporting: Custom deliverables and activation report",
        "es": "Reporte posterior al evento: Reporte de entregables y activación a medida"
      },
      {
        "en": "Hotel package: Optional add-on negotiated separately",
        "es": "Paquete de hotel: Complemento opcional negociado por separado"
      },
      {
        "en": "Naming / category exclusivity: Only if separately agreed",
        "es": "Naming / exclusividad de categoría: Solo si se acuerda por separado"
      }
    ],
    "excludes": [],
    "conditions": [
      {
        "en": "Price in USD + VAT (16%); the VAT is added at checkout. Accommodation is not included.",
        "es": "Precio en USD + IVA (16%); el IVA se suma en el checkout. No incluye hospedaje."
      },
      {
        "en": "Benefits, deliverables and dates are confirmed in the partnership agreement.",
        "es": "Beneficios, entregables y fechas se confirman en el acuerdo de patrocinio."
      },
      {
        "en": "Need an invoice (CFDI)? Write to innovation@likegroup.io after paying.",
        "es": "¿Necesitas factura (CFDI)? Escribe a innovation@likegroup.io después de pagar."
      }
    ]
  }
};
