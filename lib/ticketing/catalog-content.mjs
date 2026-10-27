// Catalog content shown in the checkout (descriptions, inclusions, conditions). Prices live in the
// database (public.passes); this file only describes the products. Sources: /tickets, /whale-tank and
// partnerships/data.json as published on 2026-10-18, updated with "01 | CHECKOUT FESTIVAL + BUSINESS PASS
// + HOTEL" (LGM, 2026-10-19).

export const CATEGORIES = {
  "festival": {
    "en": "Festival passes",
    "es": "Pases del festival"
  },
  "business": {
    "en": "Businesses · Innovation City",
    "es": "Comercios · Innovation City"
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
      "en": "Four days of innovation, conversations, networking and community in Tulum: Main Stage, talks, panels, selected public Whale Tank sessions, networking and the official activities open to the general pass, including the official parties as scheduled.",
      "es": "Cuatro días de innovación, conversaciones, networking y comunidad en Tulum: Main Stage, conferencias, paneles, sesiones públicas seleccionadas de Whale Tank, networking y actividades oficiales abiertas al pase general, incluidas las fiestas oficiales conforme a la programación."
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
        "en": "Private dinners, accommodation and transfers",
        "es": "Cenas privadas, hospedaje y traslados"
      }
    ],
    "conditions": [
      {
        "en": "Workshops and limited-capacity sessions may require registration.",
        "es": "Talleres y sesiones de cupo limitado pueden requerir registro."
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
      "en": "Full festival access plus the Executive/VIP experience: the Official Cocktail Gala, exclusive moments and special surprises as scheduled.",
      "es": "Acceso completo al festival y experiencia Executive/VIP: Official Cocktail Gala, momentos exclusivos y sorpresas especiales según programación."
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
      },
      {
        "en": "Transfers and private services, unless expressly stated",
        "es": "Traslados y servicios privados, salvo indicación expresa"
      }
    ],
    "conditions": [
      {
        "en": "USD 1,500, charged in MXN at the rate shown.",
        "es": "USD 1,500, se cobra en MXN al tipo de cambio indicado."
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
      "en": "The festival for our local community: the same inclusions as General Access, at 50% of its price for Tulum residents.",
      "es": "El festival para nuestra comunidad local: las mismas inclusiones del General Access, al 50% de su precio para residentes de Tulum."
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
        "en": "Subject to residency validation with an ID or a document accepted by the organization. If residency is not proven, the difference must be paid before entry.",
        "es": "Sujeto a validación de residencia mediante identificación o documento aceptado por la organización. Si no se acredita residencia, deberá abonarse la diferencia correspondiente antes de acceder."
      }
    ]
  },
  "business-pass": {
    "art": "/assets/tickets/business-pass-sm.webp",
    "colors": [
      "#4BFFB3",
      "#3C4BFF"
    ],
    "tagline": {
      "en": "Digital Merchant · per business",
      "es": "Digital Merchant · por comercio"
    },
    "description": {
      "en": "Bring your business into Innovation City and live Tulum Innovation Fest: a festival pass, a portable payment terminal and onboarding for your team.",
      "es": "Integra tu comercio a Innovation City y vive Tulum Innovation Fest: un pase al festival, una terminal de pagos portátil y onboarding para tu equipo."
    },
    "includes": [
      {
        "en": "One General Access pass to the festival, December 9–12",
        "es": "Un General Access al festival del 9 al 12 de diciembre"
      },
      {
        "en": "One compact, portable payment terminal per business",
        "es": "Una terminal de pagos compacta y portátil por comercio"
      },
      {
        "en": "Integrated payments: cards, QR and digital wallets",
        "es": "Sistema integrado de pagos con tarjeta, QR y wallets digitales"
      },
      {
        "en": "Onboarding and training for your team",
        "es": "Onboarding y capacitación para el equipo"
      },
      {
        "en": "Listing in Innovation City with visibility on the event channels",
        "es": "Incorporación a Innovation City con visibilidad en canales del evento"
      },
      {
        "en": "Digital marketing kit",
        "es": "Kit digital de marketing"
      }
    ],
    "excludes": [
      {
        "en": "Payment processing fees (per the payment provider's terms)",
        "es": "Tarifas de procesamiento de pagos (según condiciones del proveedor de pagos)"
      }
    ],
    "conditions": [
      {
        "en": "USD 215 per business, charged in MXN at the current rate.",
        "es": "USD 215 por comercio, se cobra en MXN al tipo de cambio vigente."
      },
      {
        "en": "We need the business name, location, contact and phone to activate it.",
        "es": "Requiere nombre comercial, ubicación, contacto y teléfono para la activación."
      },
      {
        "en": "The terminal is handed over at sign-up while stock lasts; afterwards it is shipped to the business's registered address.",
        "es": "La terminal se entrega en el alta hasta agotar existencias; posteriormente se envía a la dirección registrada del comercio."
      }
    ],
    "fields": ["businessName", "businessAddress", "phone"]
  },
  "hotel-upgrade": {
    "art": "/assets/tickets/hotel-upgrade-sm.webp",
    "colors": [
      "#25B8FF",
      "#FF3374"
    ],
    "tagline": {
      "en": "Executive only · 4 nights · Dec 9–13",
      "es": "Solo Executive · 4 noches · 9–13 dic"
    },
    "description": {
      "en": "Four hotel nights, breakfast and group transfers for Executive Pass holders.",
      "es": "Cuatro noches de hotel, desayuno y traslados grupales para titulares de Executive Pass."
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
        "en": "Scheduled airport arrival and departure transfers",
        "es": "Traslados programados de llegada y salida desde el aeropuerto"
      },
      {
        "en": "Group transfers between the hotel and the venues",
        "es": "Traslados grupales entre hotel y venues"
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
        "en": "Dinners, the Gala and private transfers",
        "es": "Cenas, gala y traslados privados"
      },
      {
        "en": "Extra nights (quoted separately)",
        "es": "Noches extra (se cotizan aparte)"
      }
    ],
    "conditions": [
      {
        "en": "Exclusive for Executive Pass holders. USD 1,500, charged in MXN at the rate shown.",
        "es": "Exclusivo para titulares de Executive Pass. USD 1,500, se cobra en MXN al tipo de cambio indicado."
      },
      {
        "en": "Hotel and room conditions are confirmed by our team by email.",
        "es": "Hotel y condiciones de habitación sujetos a confirmación de nuestro equipo por correo."
      }
    ]
  },
  "hotel-second-guest": {
    "art": "/assets/tickets/hotel-second-guest-sm.webp",
    "colors": [
      "#FF3374",
      "#25B8FF"
    ],
    "tagline": {
      "en": "Additional guest",
      "es": "Huésped adicional"
    },
    "description": {
      "en": "Second guest in a shared room with an eligible Hotel Upgrade booking, subject to permitted occupancy and the hotel's conditions.",
      "es": "Segundo huésped en habitación compartida con una reserva Hotel Upgrade elegible, sujeto a ocupación permitida y condiciones del hotel."
    },
    "includes": [
      {
        "en": "Shared room for the 4 nights of the Hotel Upgrade",
        "es": "Habitación compartida durante las 4 noches del Hotel Upgrade"
      },
      {
        "en": "Breakfast and transfers, as confirmed by our team",
        "es": "Desayuno y traslados, según confirme nuestro equipo"
      }
    ],
    "excludes": [
      {
        "en": "Festival admission (not included automatically)",
        "es": "Entrada al festival (no se incluye automáticamente)"
      },
      {
        "en": "The Hotel Upgrade itself: the main guest buys it",
        "es": "El Hotel Upgrade en sí: lo compra el huésped principal"
      }
    ],
    "conditions": [
      {
        "en": "USD 720. Only valid together with an eligible Hotel Upgrade booking.",
        "es": "USD 720. Solo válido asociado a una reserva principal de Hotel Upgrade elegible."
      }
    ]
  },
  "whale-tank-founder": {
    "art": "/assets/tickets/whale-tank-founder-sm.webp",
    "colors": ["#1FC6FF", "#0047FF"],
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
    "art": "/assets/tickets/whale-tank-team-member-sm.webp",
    "colors": ["#A07BFF", "#D35CFF"],
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
  "whale-tank-founder-no-stay": {
    "art": "/assets/tickets/whale-tank-founder-no-stay-sm.webp",
    "colors": ["#22E3B0", "#0E8F7A"],
    "tagline": {
      "en": "Selected startups · principal participant · no lodging",
      "es": "Startups seleccionadas · participante principal · sin hotel"
    },
    "description": {
      "en": "Founder package for selected Whale Tank 2026 startups that arrange their own accommodation.",
      "es": "Paquete de Founder para startups seleccionadas en Whale Tank 2026 que resuelven su propio hospedaje."
    },
    "includes": [
      {
        "en": "Full Whale Tank 2026 program: pitch sessions, mentoring and investor meetings",
        "es": "Programa completo de Whale Tank 2026: sesiones de pitch, mentorías y reuniones con inversionistas"
      },
      {
        "en": "Access to the investor room · capital pipeline USD 1.5M–3M in intent letters",
        "es": "Acceso al investor room · pipeline de capital USD 1.5M–3M en cartas de intención"
      },
      {
        "en": "4-day access to Tulum Innovation Fest · IKAL Arena",
        "es": "Acceso de 4 días a Tulum Innovation Fest · IKAL Arena"
      },
      {
        "en": "VIP upgrade (gift, value US$1,500)",
        "es": "Upgrade VIP (regalo, valor US$1,500)"
      },
      {
        "en": "Access to networking and closing events",
        "es": "Acceso a eventos de networking y closing"
      }
    ],
    "excludes": [
      {
        "en": "Hotel nights and breakfast (add Hotel Upgrade · Executive Only, US$1,500)",
        "es": "Noches de hotel y desayuno (agregar Hotel Upgrade · Executive Only, US$1,500)"
      },
      {
        "en": "Airport and festival transfers",
        "es": "Traslados aeropuerto/festival"
      }
    ],
    "conditions": [
      {
        "en": "Single payment. Only for startups selected to Whale Tank 2026.",
        "es": "Pago único. Solo para startups seleccionadas de Whale Tank 2026."
      },
      {
        "en": "Participation is subject to the Whale Tank 2026 Participation Agreement, including the 5% success fee on investment closed.",
        "es": "La participación está sujeta al Whale Tank 2026 Participation Agreement, incluido el 5% de success fee sobre la inversión cerrada."
      },
      {
        "en": "Limit 1 per startup.",
        "es": "Límite 1 por startup."
      }
    ]
  },
  "whale-tank-team-member-no-stay": {
    "art": "/assets/tickets/whale-tank-team-member-no-stay-sm.webp",
    "colors": ["#FF9A3D", "#FF3374"],
    "tagline": {
      "en": "From the second member of the same startup · no lodging",
      "es": "A partir del segundo integrante de la misma startup · sin hotel"
    },
    "description": {
      "en": "Additional team member of a selected Whale Tank 2026 startup, without accommodation.",
      "es": "Integrante adicional de una startup seleccionada en Whale Tank 2026, sin hospedaje."
    },
    "includes": [
      {
        "en": "Access to all Whale Tank 2026 sessions as an accompanying team member",
        "es": "Acceso a todas las sesiones de Whale Tank 2026 como integrante de acompañamiento"
      },
      {
        "en": "4-day access to Tulum Innovation Fest · IKAL Arena",
        "es": "Acceso de 4 días a Tulum Innovation Fest · IKAL Arena"
      },
      {
        "en": "VIP upgrade (gift, value US$1,500)",
        "es": "Upgrade VIP (regalo, valor US$1,500)"
      },
      {
        "en": "Access to networking and closing events",
        "es": "Acceso a eventos de networking y closing"
      }
    ],
    "excludes": [
      {
        "en": "Hotel nights and breakfast (add Additional Hotel Guest, US$720)",
        "es": "Noches de hotel y desayuno (agregar Additional Hotel Guest, US$720)"
      },
      {
        "en": "Airport and festival transfers",
        "es": "Traslados aeropuerto/festival"
      }
    ],
    "conditions": [
      {
        "en": "Single payment. Requires a Founder package (with or without stay) from the same startup.",
        "es": "Pago único. Requiere un paquete de Founder (con o sin estadía) de la misma startup."
      },
      {
        "en": "Limit 1 per order.",
        "es": "Límite 1 por orden."
      }
    ]
  },
  "tif-test": {
    "art": "/assets/tickets/tif-test-sm.webp",
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
    "art": "/assets/tickets/sponsor-event-supporter-sm.webp",
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
    "art": "/assets/tickets/sponsor-touchpoint-partner-sm.webp",
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
    "art": "/assets/tickets/sponsor-ecosystem-partner-sm.webp",
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
    "art": "/assets/tickets/sponsor-experience-partner-sm.webp",
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
    "art": "/assets/tickets/sponsor-strategic-partner-sm.webp",
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
  },
  "whale-tank-reservation": {
    "art": "/assets/tickets/whale-tank-reservation-sm.webp",
    "colors": ["#FFD34E", "#FF8A00"],
    "tagline": { "en": "Whale Tank 2026 · reservation", "es": "Whale Tank 2026 · reserva" },
    "description": {
      "en": "Reservation payment for Whale Tank 2026. Use it only if the Whale Tank team sent you this link.",
      "es": "Pago de reserva para Whale Tank 2026. Úsalo solo si el equipo de Whale Tank te compartió este link."
    },
    "includes": [
      { "en": "Reservation of your place in Whale Tank 2026", "es": "Reserva de tu lugar en Whale Tank 2026" },
      { "en": "Payment confirmation by email", "es": "Confirmación de pago por correo" }
    ],
    "excludes": [],
    "conditions": [
      { "en": "The Whale Tank team will contact you to confirm the next steps.", "es": "El equipo de Whale Tank te contactará para confirmar los siguientes pasos." },
      { "en": "Limit 1 per order.", "es": "Límite 1 por orden." }
    ]
  },
  "voluntary-contribution": {
    "art": "/assets/tickets/voluntary-contribution-sm.webp",
    "colors": ["#FF6FA0", "#9B3BFF"],
    "customAmount": { "min": 1, "max": 100000 },
    "tagline": { "en": "Whale Tank · voluntary contribution", "es": "Whale Tank · contribución voluntaria" },
    "description": {
      "en": "Contribute the amount you choose to support Whale Tank 2026.",
      "es": "Aporta el monto que tú elijas para apoyar Whale Tank 2026."
    },
    "includes": [
      { "en": "Payment confirmation by email", "es": "Confirmación de pago por correo" }
    ],
    "excludes": [],
    "conditions": [
      { "en": "For authorized voluntary payments only. A contribution is not a ticket, does not give access to the festival and does not buy any investment, selection or result.", "es": "Exclusivo para pagos voluntarios autorizados. Una contribución no es un boleto, no da acceso al festival y no compra inversión, selección ni resultado alguno." },
      { "en": "Amount in USD, charged in MXN at the current rate.", "es": "Monto en USD, se cobra en MXN al tipo de cambio vigente." }
    ]
  }
};
