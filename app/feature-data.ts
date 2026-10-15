/**
 * New declarative studio registry based on the reference's observed control inventory.
 * Control labels are retained; executable source, provider credentials, private prompts,
 * publisher checkout and authentication endpoints are excluded.
 */
export type FeatureKind = "image" | "text" | "audio" | "video" | "local" | "chat" | "store";
export type FeatureField = {
  id: string;
  label: string;
  type: "file" | "select" | "textarea" | "text" | "range" | "color" | "number" | "choice";
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
  required?: boolean;
  multiple?: boolean;
  accept?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
  role?: "prompt" | "count" | "ratio" | "aspectRatio" | "voice" | "image" | "video" | "language" | "style" | "resolution";
};
export type Feature = {
  id: string;
  label: string;
  description: string;
  iconId: string;
  group: string;
  kind: FeatureKind;
  fields: FeatureField[];
  promptIntent: string;
  hidden?: boolean;
  isNew?: boolean;
  capability?: "photo-editor" | "upscale" | "video-analysis" | "image-sequence" | "storyboard";
  limitations?: string[];
  variants?: Feature[];
};
export const featureGroups: { id: string; label: string; iconId: string }[] = [
  {
    "id": "general",
    "label": "Studio",
    "iconId": "home"
  },
  {
    "id": "ugc",
    "label": "Foto Produk & UGC",
    "iconId": "camera"
  },
  {
    "id": "family-lifestyle",
    "label": "Keluarga & Momen",
    "iconId": "users"
  },
  {
    "id": "personal-style",
    "label": "Foto Diri & Gaya",
    "iconId": "wand"
  },
  {
    "id": "photo-editing",
    "label": "Edit & Utilitas Foto",
    "iconId": "sliders"
  },
  {
    "id": "branding-design",
    "label": "Branding & Desain",
    "iconId": "palette"
  },
  {
    "id": "home-interior",
    "label": "Rumah & Interior",
    "iconId": "home"
  },
  {
    "id": "business-tools",
    "label": "Bisnis & Copywriting",
    "iconId": "briefcase"
  },
  {
    "id": "video-audio",
    "label": "Video & Audio",
    "iconId": "film"
  }
];

export const features: Feature[] = [
  {
    "id": "beranda",
    "label": "Beranda",
    "description": "Tanya jawab dan ide kreatif bersama asisten studio.",
    "iconId": "home",
    "group": "general",
    "kind": "chat",
    "fields": [
      {
        "id": "chat-input",
        "label": "Chat Input",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Ketik pertanyaan Anda di sini... (Contoh: 'Apa kabar?', 'Jelaskan tentang AI', dll)",
        "role": "prompt"
      }
    ],
    "promptIntent": "Help the user with their question and creative work. Respond in the user's language and be clear about uncertainties.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "ruangsaku",
    "label": "Etalase",
    "description": "Etalase produk dan informasi akses studio.",
    "iconId": "store",
    "group": "general",
    "kind": "store",
    "fields": [],
    "promptIntent": "Show the configured owner's product catalog. Never initiate a purchase automatically.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "upscale",
    "label": "Upscale",
    "description": "Tingkatkan ukuran dan detail foto dengan pilihan 2× atau 4×.",
    "iconId": "wand",
    "group": "general",
    "kind": "image",
    "fields": [
      {
        "id": "upscale-input",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "upscale-scale-options",
        "label": "Pilih Kualitas",
        "type": "choice",
        "defaultValue": "2",
        "required": false,
        "options": [
          {
            "value": "2",
            "label": "2K Cepat • ~5 detik Cocok: sosmed, WhatsApp, preview"
          },
          {
            "value": "4",
            "label": "4K Lebih tajam • ~15 detik Cocok: cetak besar, banner, e-commerce"
          }
        ]
      },
      {
        "id": "upscale-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Enhance the uploaded photograph while preserving its composition, identity and product details. Use the requested scale as the desired output size.",
    "isNew": false,
    "hidden": false,
    "capability": "upscale",
    "limitations": [
      "Provider ESRGAN khusus belum dikonfigurasi. Hasil AI meningkatkan detail; dimensi unduhan bergantung pada model."
    ]
  },
  {
    "id": "buat-model",
    "label": "Membuat Model",
    "description": "Buat referensi model dari foto wajah, pakaian, dan tipe pose.",
    "iconId": "wand",
    "group": "general",
    "kind": "image",
    "fields": [
      {
        "id": "buat-model-image-input",
        "label": "Klik atau seret foto wajah PNG, JPG, WEBP, HEIC - Wajah terlihat jelas",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "buat-model-outfit-input",
        "label": "Pakaian (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kemeja putih polos, Kaos hitam, Blazer formal...",
        "role": "prompt"
      },
      {
        "id": "buat-model-gender-selection",
        "label": "Jenis Kelamin",
        "type": "choice",
        "defaultValue": "pria",
        "required": false,
        "options": [
          {
            "value": "pria",
            "label": "Pria"
          },
          {
            "value": "wanita",
            "label": "Wanita"
          }
        ]
      },
      {
        "id": "buat-model-type-selection",
        "label": "Tipe Foto Model",
        "type": "choice",
        "defaultValue": "full-body",
        "required": false,
        "options": [
          {
            "value": "full-body",
            "label": "Full Body Seluruh badan dari kepala hingga kaki"
          },
          {
            "value": "half-body",
            "label": "Half Body Setengah badan dari pinggang ke atas"
          },
          {
            "value": "portrait",
            "label": "Portrait / Close-up Fokus pada wajah dan bahu"
          }
        ]
      },
      {
        "id": "buat-model-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 Square"
          },
          {
            "value": "3:4",
            "label": "3:4 Portrait"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          },
          {
            "value": "16:9",
            "label": "16:9 Wide"
          }
        ]
      },
      {
        "id": "buat-model-count-selection",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a professional model photograph using the supplied face as an identity reference. Apply the chosen gender presentation, framing, clothing and aspect ratio.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "affiliate",
    "label": "Foto Produk Affiliate",
    "description": "Buat foto produk untuk konten affiliate, lengkap dengan tema dan model.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "broll-image-input",
        "label": "Pilih Gambar Produk (Bisa lebih dari 1)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "broll-product-desc-input",
        "label": "Deskripsi Produk",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Smartwatch X200 tahan air dengan GPS...",
        "role": "prompt"
      },
      {
        "id": "broll-model-image-input",
        "label": "Pilih Foto Model",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "broll-photo-theme-input",
        "label": "Tema Foto (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Minimalis & bersih, nuansa alam tropis...",
        "role": "prompt"
      },
      {
        "id": "broll-background-image-input",
        "label": "Pilih Background Custom",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "affiliate-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "affiliate",
        "required": false,
        "options": [
          {
            "value": "affiliate",
            "label": "Tema Umum"
          },
          {
            "value": "affiliate-islami",
            "label": "Tema Agama"
          },
          {
            "value": "affiliate-harga",
            "label": "Tema Harga"
          },
          {
            "value": "product-premium",
            "label": "Premium"
          },
          {
            "value": "virtual-tryon",
            "label": "Coba Baju"
          }
        ]
      },
      {
        "id": "broll-theme-options",
        "label": "Tema Foto (Opsional)",
        "type": "choice",
        "defaultValue": "",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "",
            "label": "Tidak Ada"
          },
          {
            "value": "custom",
            "label": "Custom"
          },
          {
            "value": "minimalis",
            "label": "Minimalis"
          },
          {
            "value": "studio-pro",
            "label": "Studio Pro"
          },
          {
            "value": "flat-lay",
            "label": "Flat Lay"
          },
          {
            "value": "dark-moody",
            "label": "Dark Moody"
          },
          {
            "value": "bright-airy",
            "label": "Bright Airy"
          },
          {
            "value": "natural",
            "label": "Natural"
          },
          {
            "value": "cozy-home",
            "label": "Cozy Home"
          },
          {
            "value": "outdoor",
            "label": "Outdoor"
          },
          {
            "value": "beach",
            "label": "Beach"
          },
          {
            "value": "coffee-shop",
            "label": "Coffee Shop"
          },
          {
            "value": "urban",
            "label": "Urban"
          },
          {
            "value": "luxury",
            "label": "Luxury"
          },
          {
            "value": "corporate",
            "label": "Corporate"
          },
          {
            "value": "elegant",
            "label": "Elegant"
          },
          {
            "value": "bokeh",
            "label": "Bokeh"
          },
          {
            "value": "golden-hour",
            "label": "Golden Hour"
          },
          {
            "value": "neon",
            "label": "Neon"
          },
          {
            "value": "monochrome",
            "label": "Monochrome"
          },
          {
            "value": "vintage",
            "label": "Vintage"
          },
          {
            "value": "rustic",
            "label": "Rustic"
          },
          {
            "value": "fresh",
            "label": "Fresh"
          },
          {
            "value": "pastel",
            "label": "Pastel"
          },
          {
            "value": "colorful",
            "label": "Colorful"
          },
          {
            "value": "earth-tone",
            "label": "Earth Tone"
          },
          {
            "value": "spring",
            "label": "Spring"
          },
          {
            "value": "summer",
            "label": "Summer"
          },
          {
            "value": "autumn",
            "label": "Autumn"
          },
          {
            "value": "winter",
            "label": "Winter"
          },
          {
            "value": "romantic",
            "label": "Romantic"
          },
          {
            "value": "party",
            "label": "Party"
          },
          {
            "value": "christmas",
            "label": "Christmas"
          },
          {
            "value": "instagram",
            "label": "Instagram"
          },
          {
            "value": "aesthetic",
            "label": "Aesthetic"
          },
          {
            "value": "influencer",
            "label": "Influencer"
          }
        ]
      },
      {
        "id": "broll-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "broll-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a commercial product photograph from the uploaded product. Keep the product's shape and visible branding accurate, and use the selected model, theme and background.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "affiliate-islami",
        "label": "Affiliate Agama",
        "description": "Susun foto produk dengan suasana Islami yang dipilih.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "islami-product-input",
            "label": "📦 Upload foto produk PNG, JPG, HEIC (Max 10MB)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "affiliate-islami-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "affiliate-islami",
            "required": false,
            "options": [
              {
                "value": "affiliate",
                "label": "Tema Umum"
              },
              {
                "value": "affiliate-islami",
                "label": "Tema Agama"
              },
              {
                "value": "affiliate-harga",
                "label": "Tema Harga"
              },
              {
                "value": "product-premium",
                "label": "Premium"
              },
              {
                "value": "virtual-tryon",
                "label": "Coba Baju"
              }
            ]
          },
          {
            "id": "islami-model-options",
            "label": "Pilih Model",
            "type": "choice",
            "defaultValue": "mannequin",
            "required": false,
            "options": [
              {
                "value": "mannequin",
                "label": "Manekin"
              },
              {
                "value": "model-blur",
                "label": "Model Islami (Blur)"
              },
              {
                "value": "model-nonblur",
                "label": "Model Islami (Non Blur)"
              }
            ]
          },
          {
            "id": "islami-age-options",
            "label": "Kategori Usia",
            "type": "choice",
            "defaultValue": "dewasa",
            "required": false,
            "options": [
              {
                "value": "dewasa",
                "label": "Dewasa"
              },
              {
                "value": "anak",
                "label": "Anak-anak"
              },
              {
                "value": "balita",
                "label": "Balita"
              },
              {
                "value": "bayi",
                "label": "Bayi"
              }
            ]
          },
          {
            "id": "islami-category-filter",
            "label": "Select Theme",
            "type": "choice",
            "defaultValue": "all",
            "required": false,
            "options": [
              {
                "value": "all",
                "label": "Semua"
              },
              {
                "value": "islamic",
                "label": "Islam"
              },
              {
                "value": "christian",
                "label": "Kristen"
              },
              {
                "value": "hindu",
                "label": "Hindu"
              },
              {
                "value": "buddhist",
                "label": "Buddha"
              }
            ]
          },
          {
            "id": "islami-theme-options",
            "label": "Select Theme",
            "type": "choice",
            "defaultValue": "ramadan",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "ramadan",
                "label": "Ramadan"
              },
              {
                "value": "sholat",
                "label": "Prayer (Salat)"
              },
              {
                "value": "lebaran",
                "label": "Eid al-Fitr"
              },
              {
                "value": "haji",
                "label": "Hajj/Umrah"
              },
              {
                "value": "kajian",
                "label": "Islamic Study"
              },
              {
                "value": "sedekah",
                "label": "Charity (Sedekah)"
              },
              {
                "value": "berbuka",
                "label": "Iftar"
              },
              {
                "value": "tarawih",
                "label": "Tarawih Prayer"
              },
              {
                "value": "sahur",
                "label": "Suhur"
              },
              {
                "value": "zakat",
                "label": "Zakat"
              },
              {
                "value": "qurban",
                "label": "Eid al-Adha (Qurban)"
              },
              {
                "value": "muharram",
                "label": "Muharram"
              },
              {
                "value": "maulid",
                "label": "Maulid Nabi"
              },
              {
                "value": "isra-miraj",
                "label": "Isra Mi'raj"
              },
              {
                "value": "nuzulul-quran",
                "label": "Nuzulul Quran"
              },
              {
                "value": "hijrah",
                "label": "Hijrah"
              },
              {
                "value": "aqiqah",
                "label": "Aqiqah"
              },
              {
                "value": "walimah",
                "label": "Islamic Wedding"
              },
              {
                "value": "pengajian",
                "label": "Religious Gathering"
              },
              {
                "value": "pesantren",
                "label": "Islamic School"
              },
              {
                "value": "takbiran",
                "label": "Takbiran"
              },
              {
                "value": "tadarus",
                "label": "Quran Recitation"
              },
              {
                "value": "masjid",
                "label": "Mosque"
              },
              {
                "value": "dzikir",
                "label": "Dhikr"
              },
              {
                "value": "christmas",
                "label": "Christmas"
              },
              {
                "value": "easter",
                "label": "Easter"
              },
              {
                "value": "church-wedding",
                "label": "Church Wedding"
              },
              {
                "value": "baptism",
                "label": "Baptism"
              },
              {
                "value": "first-communion",
                "label": "First Communion"
              },
              {
                "value": "confirmation",
                "label": "Confirmation"
              },
              {
                "value": "sunday-service",
                "label": "Sunday Service"
              },
              {
                "value": "advent",
                "label": "Advent"
              },
              {
                "value": "lent",
                "label": "Lent"
              },
              {
                "value": "pentecost",
                "label": "Pentecost"
              },
              {
                "value": "good-friday",
                "label": "Good Friday"
              },
              {
                "value": "christian-charity",
                "label": "Christian Charity"
              },
              {
                "value": "diwali",
                "label": "Diwali"
              },
              {
                "value": "holi",
                "label": "Holi"
              },
              {
                "value": "navratri",
                "label": "Navratri"
              },
              {
                "value": "ganesh-chaturthi",
                "label": "Ganesh Chaturthi"
              },
              {
                "value": "hindu-wedding",
                "label": "Hindu Wedding"
              },
              {
                "value": "puja",
                "label": "Puja Ceremony"
              },
              {
                "value": "raksha-bandhan",
                "label": "Raksha Bandhan"
              },
              {
                "value": "temple-visit",
                "label": "Temple Visit"
              },
              {
                "value": "vesak",
                "label": "Vesak"
              },
              {
                "value": "meditation",
                "label": "Meditation"
              },
              {
                "value": "buddhist-temple",
                "label": "Temple Ceremony"
              },
              {
                "value": "buddha-day",
                "label": "Buddha Day"
              },
              {
                "value": "mindfulness",
                "label": "Mindfulness"
              },
              {
                "value": "buddhist-offering",
                "label": "Offering Ceremony"
              }
            ]
          },
          {
            "id": "islami-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "3:4",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "islami-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          },
          {
            "id": "affiliate-islami-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Create respectful Islamic-themed commercial product photography. Preserve the uploaded product and apply the selected setting and styling.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "affiliate-harga",
        "label": "Affiliate Harga",
        "description": "Tampilkan produk bersama harga dan elemen promosi.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "hrg-image-input",
            "label": "Pilih Gambar Produk (Bisa lebih dari 1)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "multiple": true,
            "role": "image"
          },
          {
            "id": "hrg-product-desc-input",
            "label": "Deskripsi Produk",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Smartwatch X200 tahan air dengan GPS...",
            "role": "prompt"
          },
          {
            "id": "hrg-model-image-input",
            "label": "Pilih Foto Model",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "hrg-background-image-input",
            "label": "Pilih Background Custom",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "affiliate-harga-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "affiliate-harga",
            "required": false,
            "options": [
              {
                "value": "affiliate",
                "label": "Tema Umum"
              },
              {
                "value": "affiliate-islami",
                "label": "Tema Agama"
              },
              {
                "value": "affiliate-harga",
                "label": "Tema Harga"
              },
              {
                "value": "product-premium",
                "label": "Premium"
              },
              {
                "value": "virtual-tryon",
                "label": "Coba Baju"
              }
            ]
          },
          {
            "id": "hrg-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "4:5",
                "label": "4:5"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "hrg-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a readable commercial product image using the supplied price and promotion details. Do not invent prices or product claims.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "virtual-tryon",
        "label": "Virtual Try-On",
        "description": "Lihat produk fashion pada model dengan referensi pakaian.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "tryon-product-input",
            "label": "Unggah Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "tryon-model-input",
            "label": "Unggah Foto Model",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "tryon-custom-angle",
            "label": "Custom Angle Description",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: diagonal view from above showing product details...",
            "role": "prompt"
          },
          {
            "id": "virtual-tryon-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "virtual-tryon",
            "required": false,
            "options": [
              {
                "value": "affiliate",
                "label": "Tema Umum"
              },
              {
                "value": "affiliate-islami",
                "label": "Tema Agama"
              },
              {
                "value": "affiliate-harga",
                "label": "Tema Harga"
              },
              {
                "value": "product-premium",
                "label": "Premium"
              },
              {
                "value": "virtual-tryon",
                "label": "Coba Baju"
              }
            ]
          },
          {
            "id": "tryon-angle-selection",
            "label": "Pilih Angle Foto",
            "type": "choice",
            "defaultValue": "Front View",
            "required": false,
            "options": [
              {
                "value": "Front View",
                "label": "Front View"
              },
              {
                "value": "Side View",
                "label": "Side View"
              },
              {
                "value": "Back View",
                "label": "Back View"
              },
              {
                "value": "3/4 View",
                "label": "3/4 View"
              },
              {
                "value": "Top Down",
                "label": "Top Down"
              },
              {
                "value": "Close Up",
                "label": "Close Up"
              },
              {
                "value": "Full Body",
                "label": "Full Body"
              },
              {
                "value": "custom",
                "label": "Custom"
              }
            ]
          },
          {
            "id": "tryon-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "3:4",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "4:5",
                "label": "4:5"
              },
              {
                "value": "9:16",
                "label": "9:16"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "2:3",
                "label": "2:3"
              }
            ]
          },
          {
            "id": "tryon-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Apply the uploaded garment or accessory to the supplied model photograph, maintaining the face and the garment's important visual details.",
        "isNew": true,
        "hidden": true
      },
      {
        "id": "product-premium",
        "label": "Foto Produk Premium",
        "description": "Buat foto produk dengan tampilan studio premium.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "pp-product-upload",
            "label": "Klik untuk upload foto produk Foto produk yang mau di-style",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "pp-model-upload",
            "label": "Klik untuk upload foto model Wajah/tubuh yang berinteraksi dengan produk",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "pp-custom-prompt",
            "label": "Custom Prompt (opsional)",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Tulis arahan tambahan untuk AI...",
            "role": "prompt"
          },
          {
            "id": "product-premium-choice-1",
            "label": "Produk",
            "type": "choice",
            "defaultValue": "product-premium",
            "required": false,
            "options": [
              {
                "value": "affiliate",
                "label": "Tema Umum"
              },
              {
                "value": "affiliate-islami",
                "label": "Tema Agama"
              },
              {
                "value": "affiliate-harga",
                "label": "Tema Harga"
              },
              {
                "value": "product-premium",
                "label": "Premium"
              },
              {
                "value": "virtual-tryon",
                "label": "Coba Baju"
              }
            ]
          },
          {
            "id": "pp-mode-options",
            "label": "Pilih Mode",
            "type": "choice",
            "defaultValue": "artistic",
            "required": false,
            "options": [
              {
                "value": "artistic",
                "label": "Artistic 6 surreal/cinematic themes"
              },
              {
                "value": "lifestyle",
                "label": "Lifestyle 6 in-context scenes"
              }
            ]
          },
          {
            "id": "pp-themes-artistic",
            "label": "Tema Artistic Scene Lifestyle",
            "type": "choice",
            "defaultValue": "surreal-nature",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "surreal-nature",
                "label": "Surreal Nature"
              },
              {
                "value": "surreal-cosmic",
                "label": "Surreal Cosmic"
              },
              {
                "value": "dark-luxury",
                "label": "Dark Luxury"
              },
              {
                "value": "hyper-minimal",
                "label": "Hyper Minimal"
              },
              {
                "value": "liquid-splash",
                "label": "Liquid Splash"
              },
              {
                "value": "floating-lifestyle",
                "label": "Floating Lifestyle"
              }
            ]
          },
          {
            "id": "pp-themes-lifestyle",
            "label": "Tema Artistic Scene Lifestyle",
            "type": "choice",
            "defaultValue": "hand-holding",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "hand-holding",
                "label": "Hand Holding"
              },
              {
                "value": "on-desk-cafe",
                "label": "Cafe Desk"
              },
              {
                "value": "outdoor-adventure",
                "label": "Outdoor Adventure"
              },
              {
                "value": "kitchen-counter",
                "label": "Kitchen Counter"
              },
              {
                "value": "vanity-bathroom",
                "label": "Vanity Bathroom"
              },
              {
                "value": "gym-fitness",
                "label": "Gym & Fitness"
              }
            ]
          },
          {
            "id": "pp-mood-options",
            "label": "Mood",
            "type": "choice",
            "defaultValue": "warm",
            "required": false,
            "options": [
              {
                "value": "warm",
                "label": "Warm"
              },
              {
                "value": "cool",
                "label": "Cool"
              },
              {
                "value": "dramatic",
                "label": "Dramatic"
              },
              {
                "value": "soft",
                "label": "Soft"
              }
            ]
          },
          {
            "id": "pp-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "4:5",
                "label": "4:5"
              },
              {
                "value": "9:16",
                "label": "9:16"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "4:3",
                "label": "4:3"
              }
            ]
          },
          {
            "id": "pp-count-options",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create refined premium product photography with the selected lighting, materials and composition while preserving the product reference.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "feedbranding",
    "label": "Feed Branding",
    "description": "Susun tampilan feed produk sesuai identitas visual merek.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "fb-custom-topic",
        "label": "Pilih Mode",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "mis. Promo Ramadan, Manfaat untuk kulit kusam"
      },
      {
        "id": "fb-image-input",
        "label": "Klik untuk unggah foto produk PNG, JPG, WEBP, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "fb-brand-name",
        "label": "Nama Brand *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Nama brand (mis. Crystalin)"
      },
      {
        "id": "fb-slogan",
        "label": "Info Tambahan (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Slogan (opsional)"
      },
      {
        "id": "fb-price",
        "label": "Info Tambahan (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Harga (mis. Rp5.000)"
      },
      {
        "id": "fb-accent-color",
        "label": "Warna Utama",
        "type": "color",
        "defaultValue": "#16a34a",
        "required": false
      },
      {
        "id": "fb-accent-hex",
        "label": "Warna Utama",
        "type": "text",
        "defaultValue": "#16a34a",
        "required": false,
        "placeholder": "#16a34a"
      },
      {
        "id": "fb-accent2-color",
        "label": "Warna Sekunder (Opsional)",
        "type": "color",
        "defaultValue": "#facc15",
        "required": false
      },
      {
        "id": "fb-accent2-hex",
        "label": "Warna Sekunder (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Kosongkan jika tidak perlu"
      },
      {
        "id": "fb-mode-selection",
        "label": "Pilih Mode",
        "type": "choice",
        "defaultValue": "standar",
        "required": false,
        "options": [
          {
            "value": "standar",
            "label": "Standar"
          },
          {
            "value": "random",
            "label": "Acak"
          },
          {
            "value": "custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "fb-ratio-selection",
        "label": "Rasio Foto",
        "type": "choice",
        "defaultValue": "4:5",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "4:5",
            "label": "4:5Feed IG"
          },
          {
            "value": "1:1",
            "label": "1:1Square"
          },
          {
            "value": "9:16",
            "label": "9:16Story"
          }
        ]
      },
      {
        "id": "feedbranding-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "feedbranding-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Design a coherent social-media product feed image using the selected brand palette, layout, typography and content. Preserve product accuracy.",
    "isNew": true,
    "hidden": false
  },
  {
    "id": "mockup-studio",
    "label": "Mockup Studio",
    "description": "Tempatkan desain atau produk pada mockup yang sesuai.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "mockup-design-input",
        "label": "Upload Design/Artwork",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "mockup-template-input",
        "label": "Template Mockup Referensi (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "mockup-theme-input",
        "label": "Tema Mockup Manual (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: gelas, kaos, poster, mug, buku, smartphone, tote bag, dll...",
        "role": "style"
      },
      {
        "id": "mockup-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "mockup-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "mockup-studio-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a realistic mockup of the supplied design or product on the chosen object and scene. Keep graphics legible and perspective consistent.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "product-mockup",
        "label": "Product Mockup",
        "description": "Tempatkan produk dalam situasi penggunaan pilihan.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "mockup-image-upload",
            "label": "Upload Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "mockup-scene-selection",
            "label": "Mockup Scene",
            "type": "choice",
            "defaultValue": "desk",
            "required": false,
            "options": [
              {
                "value": "desk",
                "label": "Desk/Office"
              },
              {
                "value": "cafe",
                "label": "Cafe/Coffee"
              },
              {
                "value": "outdoor",
                "label": "Outdoor"
              },
              {
                "value": "bedroom",
                "label": "Bedroom"
              },
              {
                "value": "kitchen",
                "label": "Kitchen"
              },
              {
                "value": "studio",
                "label": "Studio"
              }
            ]
          },
          {
            "id": "mockup-perspective-selection",
            "label": "3D Perspective",
            "type": "choice",
            "defaultValue": "flat",
            "required": false,
            "options": [
              {
                "value": "flat",
                "label": "Flat/Top"
              },
              {
                "value": "angled",
                "label": "Angled"
              },
              {
                "value": "floating",
                "label": "Floating"
              }
            ]
          },
          {
            "id": "mockup-mood-selection",
            "label": "Lighting/Mood",
            "type": "choice",
            "defaultValue": "bright",
            "required": false,
            "options": [
              {
                "value": "bright",
                "label": "Bright"
              },
              {
                "value": "warm",
                "label": "Warm/Cozy"
              },
              {
                "value": "dark",
                "label": "Dark/Moody"
              },
              {
                "value": "minimal",
                "label": "Minimal"
              }
            ]
          },
          {
            "id": "mockup-aspect-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "4:5",
                "label": "4:5"
              }
            ]
          },
          {
            "id": "mockup-count-selection",
            "label": "Jumlah Variasi",
            "type": "choice",
            "defaultValue": "3",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "3",
                "label": "3 Mockups"
              },
              {
                "value": "4",
                "label": "4 Mockups"
              },
              {
                "value": "6",
                "label": "6 Mockups"
              }
            ]
          },
          {
            "id": "product-mockup-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Create a realistic lifestyle product mockup using the uploaded product and chosen environment.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "pov-tangan",
    "label": "POV Studio",
    "description": "Buat foto produk dari sudut pandang tangan, selfie, atau mirror.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "pov-image-input",
        "label": "Upload Foto Produk",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "pov-bg-input",
        "label": "Background Custom (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "pov-product-description",
        "label": "Deskripsi Background (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Meja kayu minimalis dengan tanaman hijau, Cafe aesthetic Korea dengan latte, Background pink aesthetic dengan pegboard, dll...",
        "role": "prompt"
      },
      {
        "id": "pov-tangan-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "pov-tangan",
        "required": false,
        "options": [
          {
            "value": "pov-tangan",
            "label": "POV Tangan"
          },
          {
            "value": "pov-selfie",
            "label": "POV Selfie"
          },
          {
            "value": "mirror-selfie",
            "label": "Mirror Selfie"
          },
          {
            "value": "walking-pad",
            "label": "POV Walking Pad"
          },
          {
            "value": "pov-kaki",
            "label": "POV Kaki"
          }
        ]
      },
      {
        "id": "pov-theme-selection",
        "label": "Tema Background",
        "type": "choice",
        "defaultValue": "random",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "random",
            "label": "Acak (Semua Tema)"
          },
          {
            "value": "feminin",
            "label": "Feminin Aesthetic"
          },
          {
            "value": "minimal",
            "label": "Minimalis & Clean"
          },
          {
            "value": "cafe",
            "label": "Cafe & Kuliner"
          },
          {
            "value": "nature",
            "label": "Alam & Outdoor"
          },
          {
            "value": "urban",
            "label": "Urban & Street"
          },
          {
            "value": "luxury",
            "label": "Dark & Luxury"
          },
          {
            "value": "home",
            "label": "Rumah & Cozy"
          },
          {
            "value": "tech",
            "label": "Tech & Studio"
          }
        ]
      },
      {
        "id": "pov-hand-count-selection",
        "label": "Jumlah Tangan",
        "type": "choice",
        "defaultValue": "1",
        "required": false,
        "options": [
          {
            "value": "1",
            "label": "1 Tangan"
          },
          {
            "value": "2",
            "label": "2 Tangan"
          }
        ]
      },
      {
        "id": "pov-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "pov-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a first-person commercial photograph featuring the uploaded product. Apply the selected viewpoint, hands, background and aspect ratio.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "pov-selfie",
        "label": "POV Selfie",
        "description": "Buat adegan selfie sambil memperlihatkan produk.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "povselfie-product-input",
            "label": "Upload Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "povselfie-model-input",
            "label": "Upload Foto Model",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "povselfie-desc",
            "label": "Deskripsi Tambahan (Opsional)",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: di cafe aesthetic, pakai hijab, senyum ceria, suasana sore hari, dll...",
            "role": "prompt"
          },
          {
            "id": "pov-selfie-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "pov-selfie",
            "required": false,
            "options": [
              {
                "value": "pov-tangan",
                "label": "POV Tangan"
              },
              {
                "value": "pov-selfie",
                "label": "POV Selfie"
              },
              {
                "value": "mirror-selfie",
                "label": "Mirror Selfie"
              },
              {
                "value": "walking-pad",
                "label": "POV Walking Pad"
              },
              {
                "value": "pov-kaki",
                "label": "POV Kaki"
              }
            ]
          },
          {
            "id": "povselfie-camera-selection",
            "label": "Jenis Kamera",
            "type": "choice",
            "defaultValue": "hp",
            "required": false,
            "options": [
              {
                "value": "hp",
                "label": "Kamera HP"
              },
              {
                "value": "dslr",
                "label": "DSLR"
              },
              {
                "value": "mirrorless",
                "label": "Mirrorless"
              },
              {
                "value": "analog",
                "label": "Analog / Film"
              }
            ]
          },
          {
            "id": "povselfie-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "3:4",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "9:16",
                "label": "9:16"
              },
              {
                "value": "16:9",
                "label": "16:9"
              }
            ]
          },
          {
            "id": "povselfie-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a natural selfie-style product photograph using the selected model identity and product reference.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "mirror-selfie",
        "label": "POV Mirror Selfie",
        "description": "Tampilkan produk atau outfit dalam adegan mirror selfie.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "mirror-product-input",
            "label": "📦 Klik untuk upload produk Bisa produk apapun (baju, sepatu, makeup, dll)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "mirror-model-input",
            "label": "👤 Klik untuk upload foto model Opsional - Untuk hasil selfie lebih personal",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "mirror-custom-type-input",
            "label": "Jenis Mirror",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Standing mirror with LED lights, Wall-mounted round mirror, dll",
            "role": "prompt"
          },
          {
            "id": "mirror-custom-style-input",
            "label": "Style Ruangan",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Scandinavian bedroom with plants, Japanese zen bathroom, Industrial coffee shop, dll",
            "role": "prompt"
          },
          {
            "id": "mirror-selfie-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "mirror-selfie",
            "required": false,
            "options": [
              {
                "value": "pov-tangan",
                "label": "POV Tangan"
              },
              {
                "value": "pov-selfie",
                "label": "POV Selfie"
              },
              {
                "value": "mirror-selfie",
                "label": "Mirror Selfie"
              },
              {
                "value": "walking-pad",
                "label": "POV Walking Pad"
              },
              {
                "value": "pov-kaki",
                "label": "POV Kaki"
              }
            ]
          },
          {
            "id": "mirror-type-options",
            "label": "Jenis Mirror",
            "type": "choice",
            "defaultValue": "full-body",
            "required": false,
            "options": [
              {
                "value": "full-body",
                "label": "Full Body Mirror"
              },
              {
                "value": "bathroom",
                "label": "Bathroom Mirror"
              },
              {
                "value": "vanity",
                "label": "Vanity Mirror"
              },
              {
                "value": "gym",
                "label": "Gym Mirror"
              },
              {
                "value": "bedroom",
                "label": "Bedroom Mirror"
              },
              {
                "value": "fitting-room",
                "label": "Fitting Room"
              },
              {
                "value": "custom",
                "label": "Custom"
              }
            ]
          },
          {
            "id": "mirror-room-style-options",
            "label": "Style Ruangan",
            "type": "choice",
            "defaultValue": "modern-minimalist",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "modern-minimalist",
                "label": "Modern Minimalist"
              },
              {
                "value": "aesthetic-korean",
                "label": "Aesthetic Korean"
              },
              {
                "value": "luxury-hotel",
                "label": "Luxury Hotel"
              },
              {
                "value": "vintage-retro",
                "label": "Vintage Retro"
              },
              {
                "value": "industrial-loft",
                "label": "Industrial Loft"
              },
              {
                "value": "cozy-apartment",
                "label": "Cozy Apartment"
              },
              {
                "value": "white-clean",
                "label": "White Clean"
              },
              {
                "value": "dark-moody",
                "label": "Dark Moody"
              },
              {
                "value": "custom",
                "label": "Custom"
              }
            ]
          },
          {
            "id": "mirror-phone-options",
            "label": "Model HP",
            "type": "choice",
            "defaultValue": "iphone",
            "required": false,
            "options": [
              {
                "value": "iphone",
                "label": "iPhone"
              },
              {
                "value": "samsung",
                "label": "Samsung"
              },
              {
                "value": "aesthetic-case",
                "label": "Aesthetic Case"
              },
              {
                "value": "no-phone",
                "label": "No Phone Visible"
              }
            ]
          },
          {
            "id": "mirror-hand-options",
            "label": "Posisi Tangan",
            "type": "choice",
            "defaultValue": "holding-phone",
            "required": false,
            "options": [
              {
                "value": "holding-phone",
                "label": "Pegang HP"
              },
              {
                "value": "one-hand-hip",
                "label": "Tangan di Pinggang"
              },
              {
                "value": "peace-sign",
                "label": "Peace Sign"
              },
              {
                "value": "holding-product",
                "label": "Pegang Produk"
              },
              {
                "value": "natural",
                "label": "Natural/Santai"
              },
              {
                "value": "both-hands-up",
                "label": "Kedua Tangan Naik"
              }
            ]
          },
          {
            "id": "mirror-lighting-options",
            "label": "Pencahayaan",
            "type": "choice",
            "defaultValue": "natural-bright",
            "required": false,
            "options": [
              {
                "value": "natural-bright",
                "label": "Natural Bright"
              },
              {
                "value": "warm-cozy",
                "label": "Warm Cozy"
              },
              {
                "value": "neon-aesthetic",
                "label": "Neon Aesthetic"
              },
              {
                "value": "soft-diffused",
                "label": "Soft Diffused"
              },
              {
                "value": "golden-hour",
                "label": "Golden Hour"
              },
              {
                "value": "cool-white",
                "label": "Cool White"
              }
            ]
          },
          {
            "id": "mirror-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "9:16",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "9:16",
                "label": "9:16 (Story)"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "4:5",
                "label": "4:5 (IG)"
              },
              {
                "value": "16:9",
                "label": "16:9"
              }
            ]
          },
          {
            "id": "mirror-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a realistic mirror-selfie scene using the uploaded product or outfit, maintaining the selected model identity.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "walking-pad",
        "label": "POV Walking Pad",
        "description": "Buat foto fashion dengan adegan berjalan pada walking pad.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "walkpad-model-input",
            "label": "Upload Foto Model (Wajah Referensi)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "walkpad-product-input",
            "label": "Upload Foto Produk/Baju",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "multiple": true,
            "role": "image"
          },
          {
            "id": "walking-pad-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "walking-pad",
            "required": false,
            "options": [
              {
                "value": "pov-tangan",
                "label": "POV Tangan"
              },
              {
                "value": "pov-selfie",
                "label": "POV Selfie"
              },
              {
                "value": "mirror-selfie",
                "label": "Mirror Selfie"
              },
              {
                "value": "walking-pad",
                "label": "POV Walking Pad"
              },
              {
                "value": "pov-kaki",
                "label": "POV Kaki"
              }
            ]
          },
          {
            "id": "walkpad-room-options",
            "label": "Tema Ruangan (18 tema)",
            "type": "choice",
            "defaultValue": "aesthetic-pink",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "aesthetic-pink",
                "label": "Aesthetic Pink"
              },
              {
                "value": "korean-minimal",
                "label": "Korean Minimal"
              },
              {
                "value": "boho-natural",
                "label": "Boho Natural"
              },
              {
                "value": "luxury-white",
                "label": "Luxury White"
              },
              {
                "value": "pastel-cute",
                "label": "Pastel Cute"
              },
              {
                "value": "botanical-green",
                "label": "Botanical Green"
              },
              {
                "value": "fashion-closet",
                "label": "Fashion Closet"
              },
              {
                "value": "scandinavian",
                "label": "Scandinavian"
              },
              {
                "value": "dark-modern",
                "label": "Dark Modern"
              },
              {
                "value": "gaming-setup",
                "label": "Gaming Setup"
              },
              {
                "value": "home-gym",
                "label": "Home Gym"
              },
              {
                "value": "industrial-loft",
                "label": "Industrial Loft"
              },
              {
                "value": "streetwear-room",
                "label": "Streetwear Room"
              },
              {
                "value": "smart-home",
                "label": "Smart Home"
              },
              {
                "value": "minimalist-gray",
                "label": "Minimalist Gray"
              },
              {
                "value": "white-studio",
                "label": "White Studio"
              },
              {
                "value": "living-room",
                "label": "Living Room"
              },
              {
                "value": "cafe-office",
                "label": "Cafe & Office"
              }
            ]
          },
          {
            "id": "walkpad-angle-options",
            "label": "Camera Angle",
            "type": "choice",
            "defaultValue": "diagonal-right",
            "required": false,
            "options": [
              {
                "value": "diagonal-right",
                "label": "3/4 Depan Kanan"
              },
              {
                "value": "front-full",
                "label": "Front Full Body"
              },
              {
                "value": "diagonal-left",
                "label": "3/4 Depan Kiri"
              },
              {
                "value": "side-view",
                "label": "Side View"
              },
              {
                "value": "low-angle",
                "label": "Low Angle"
              },
              {
                "value": "bust-shot",
                "label": "Half Body"
              }
            ]
          },
          {
            "id": "walkpad-pose-options",
            "label": "Pose Model",
            "type": "choice",
            "defaultValue": "walking-motion",
            "required": false,
            "options": [
              {
                "value": "walking-motion",
                "label": "Berjalan"
              },
              {
                "value": "standing-casual",
                "label": "Berdiri Santai"
              },
              {
                "value": "standing-confident",
                "label": "Berdiri Percaya Diri"
              }
            ]
          },
          {
            "id": "walkpad-lighting-options",
            "label": "Pencahayaan",
            "type": "choice",
            "defaultValue": "natural-bright",
            "required": false,
            "options": [
              {
                "value": "natural-bright",
                "label": "Natural Bright"
              },
              {
                "value": "warm-cozy",
                "label": "Warm Cozy"
              },
              {
                "value": "cool-white",
                "label": "Cool White LED"
              },
              {
                "value": "soft-diffused",
                "label": "Soft Diffused"
              },
              {
                "value": "golden-hour",
                "label": "Golden Hour"
              }
            ]
          },
          {
            "id": "walkpad-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "9:16",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "9:16",
                "label": "9:16 TikTok"
              },
              {
                "value": "3:4",
                "label": "3:4 Feed"
              },
              {
                "value": "1:1",
                "label": "1:1 Square"
              }
            ]
          },
          {
            "id": "walkpad-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          },
          {
            "id": "walking-pad-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Create a fashion product photograph showing the model using a walking pad, with the supplied clothing and selected scene.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "pov-kaki",
        "label": "POV Kaki",
        "description": "Buat foto produk alas kaki dari sudut pandang pengguna.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "povkaki-image-input",
            "label": "Upload Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "povkaki-bg-input",
            "label": "Background Custom (Opsional)",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "povkaki-product-description",
            "label": "Deskripsi Background (Opsional)",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Jalan aesthetic Jepang saat sore, Lantai marmer mall mewah, Trotoar dengan daun musim gugur, dll...",
            "role": "prompt"
          },
          {
            "id": "pov-kaki-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "pov-kaki",
            "required": false,
            "options": [
              {
                "value": "pov-tangan",
                "label": "POV Tangan"
              },
              {
                "value": "pov-selfie",
                "label": "POV Selfie"
              },
              {
                "value": "mirror-selfie",
                "label": "Mirror Selfie"
              },
              {
                "value": "walking-pad",
                "label": "POV Walking Pad"
              },
              {
                "value": "pov-kaki",
                "label": "POV Kaki"
              }
            ]
          },
          {
            "id": "povkaki-theme-selection",
            "label": "Tema Background",
            "type": "choice",
            "defaultValue": "random",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "random",
                "label": "Acak (Semua Tema)"
              },
              {
                "value": "street",
                "label": "Jalanan & Street"
              },
              {
                "value": "urban",
                "label": "Tangga & Urban"
              },
              {
                "value": "beach",
                "label": "Pantai & Alam"
              },
              {
                "value": "cafe",
                "label": "Cafe & Indoor"
              },
              {
                "value": "sporty",
                "label": "Gym & Sporty"
              },
              {
                "value": "minimal",
                "label": "Minimalis Studio"
              },
              {
                "value": "luxury",
                "label": "Dark & Luxury"
              },
              {
                "value": "home",
                "label": "Cozy Home"
              }
            ]
          },
          {
            "id": "povkaki-pose-selection",
            "label": "Gaya Pose",
            "type": "choice",
            "defaultValue": "random",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "random",
                "label": "Acak"
              },
              {
                "value": "standing",
                "label": "Berdiri Menunduk"
              },
              {
                "value": "sitting",
                "label": "Duduk Santai"
              },
              {
                "value": "walking",
                "label": "Jalan (Mid-Step)"
              }
            ]
          },
          {
            "id": "povkaki-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "9:16",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "povkaki-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a first-person footwear photograph preserving the uploaded shoe design and chosen environment.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "pose-fashion",
    "label": "Pose Fashion",
    "description": "Coba pose dan komposisi foto fashion yang dipilih.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "pose-file-input",
        "label": "JPG, PNG, WEBP (Maks 5MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "pose-desc-input",
        "label": "Kosongkan untuk pose fashion bervariasi otomatis",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: confident standing with arms crossed, sitting elegantly on a chair...",
        "role": "prompt"
      },
      {
        "id": "pose-fashion-choice-1",
        "label": "0 /10 pose dipilih",
        "type": "choice",
        "defaultValue": "hands-on-hips",
        "required": false,
        "options": [
          {
            "value": "hands-on-hips",
            "label": "Hands on hips"
          },
          {
            "value": "tangan-silang",
            "label": "Tangan silang"
          },
          {
            "value": "tangan-di-saku",
            "label": "Tangan di saku"
          },
          {
            "value": "berdiri-tegak",
            "label": "Berdiri tegak"
          },
          {
            "value": "contrapposto",
            "label": "Contrapposto"
          },
          {
            "value": "power-stance",
            "label": "Power stance"
          },
          {
            "value": "tangan-ke-atas",
            "label": "Tangan ke atas"
          },
          {
            "value": "pegang-kerah",
            "label": "Pegang kerah"
          },
          {
            "value": "asimetris",
            "label": "Asimetris"
          },
          {
            "value": "jinjit",
            "label": "Jinjit"
          },
          {
            "value": "berjalan",
            "label": "Berjalan"
          },
          {
            "value": "berlari-gaya",
            "label": "Berlari gaya"
          },
          {
            "value": "berputar",
            "label": "Berputar"
          },
          {
            "value": "melompat",
            "label": "Melompat"
          },
          {
            "value": "pose-s-curve",
            "label": "Pose S-curve"
          },
          {
            "value": "catwalk",
            "label": "Catwalk"
          },
          {
            "value": "duduk-elegan",
            "label": "Duduk elegan"
          },
          {
            "value": "duduk-di-lantai",
            "label": "Duduk di lantai"
          },
          {
            "value": "duduk-di-tangga",
            "label": "Duduk di tangga"
          },
          {
            "value": "duduk-santai",
            "label": "Duduk santai"
          },
          {
            "value": "kaki-lurus",
            "label": "Kaki lurus"
          },
          {
            "value": "duduk-bersila",
            "label": "Duduk bersila"
          },
          {
            "value": "sandaran-dinding",
            "label": "Sandaran dinding"
          },
          {
            "value": "sandaran-pintu",
            "label": "Sandaran pintu"
          },
          {
            "value": "bersandar-kursi",
            "label": "Bersandar kursi"
          },
          {
            "value": "siku-di-lutut",
            "label": "Siku di lutut"
          },
          {
            "value": "over-shoulder",
            "label": "Over shoulder"
          },
          {
            "value": "side-profile",
            "label": "Side profile"
          },
          {
            "value": "dari-belakang",
            "label": "Dari belakang"
          },
          {
            "value": "tatapan-fierce",
            "label": "Tatapan fierce"
          },
          {
            "value": "tertawa-lepas",
            "label": "Tertawa lepas"
          },
          {
            "value": "senyum-lembut",
            "label": "Senyum lembut"
          },
          {
            "value": "bingkai-wajah",
            "label": "Bingkai wajah"
          },
          {
            "value": "pegang-dagu",
            "label": "Pegang dagu"
          },
          {
            "value": "sentuh-rambut",
            "label": "Sentuh rambut"
          },
          {
            "value": "tangan-di-pipi",
            "label": "Tangan di pipi"
          },
          {
            "value": "high-fashion",
            "label": "High fashion"
          },
          {
            "value": "cover-majalah",
            "label": "Cover majalah"
          },
          {
            "value": "avant-garde",
            "label": "Avant-garde"
          },
          {
            "value": "santai-di-sofa",
            "label": "Santai di sofa"
          },
          {
            "value": "berbaring",
            "label": "Berbaring"
          },
          {
            "value": "pegang-tas",
            "label": "Pegang tas"
          },
          {
            "value": "pegang-kacamata",
            "label": "Pegang kacamata"
          },
          {
            "value": "pegang-topi",
            "label": "Pegang topi"
          },
          {
            "value": "pegang-bunga",
            "label": "Pegang bunga"
          },
          {
            "value": "pegang-kopi",
            "label": "Pegang kopi"
          },
          {
            "value": "candid-natural",
            "label": "Candid natural"
          },
          {
            "value": "outdoor-natural",
            "label": "Outdoor natural"
          },
          {
            "value": "pose-ekspresif",
            "label": "Pose ekspresif"
          },
          {
            "value": "pose-lucu",
            "label": "Pose lucu"
          },
          {
            "value": "stop-hand",
            "label": "Stop hand"
          }
        ]
      },
      {
        "id": "pose-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "pose-fashion-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Create a fashion photograph with the selected pose while preserving the model's identity and uploaded outfit.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "food-selfie",
    "label": "Food Selfie",
    "description": "Buat foto makanan bersama model dalam suasana pilihan.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "food-selfie-food-file-input",
        "label": "Unggah Foto Makanan",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "food-selfie-model-input",
        "label": "Pilih Foto Model/Orang Orang ini akan muncul di foto dengan makanan",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "food-selfie-custom-theme-input",
        "label": "✨ Tulis Tema Custom Anda:",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: futuristic neon lights with cyberpunk aesthetic, vintage 80s retro with warm tones, dreamy pastel garden with flowers...",
        "role": "prompt"
      },
      {
        "id": "food-selfie-background-input",
        "label": "Pilih Background Custom",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "food-selfie-style-file-input",
        "label": "Referensi (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "food-selfie-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "food-selfie",
        "required": false,
        "options": [
          {
            "value": "food-selfie",
            "label": "Foto Makanan"
          },
          {
            "value": "food-ramadan",
            "label": "Tema Ramadan"
          }
        ]
      },
      {
        "id": "food-selfie-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 (Instagram Post)"
          },
          {
            "value": "4:5",
            "label": "4:5 (Instagram Feed)"
          },
          {
            "value": "9:16",
            "label": "9:16 (Stories/Reels)"
          },
          {
            "value": "3:4",
            "label": "3:4 (Portrait)"
          },
          {
            "value": "2:3",
            "label": "2:3 (Pinterest)"
          },
          {
            "value": "16:9",
            "label": "16:9 (YouTube)"
          },
          {
            "value": "3:2",
            "label": "3:2 (Kamera DSLR)"
          },
          {
            "value": "4:3",
            "label": "4:3 (Klasik)"
          },
          {
            "value": "21:9",
            "label": "21:9 (Cinematic)"
          },
          {
            "value": "5:4",
            "label": "5:4 (Cetak/Menu)"
          }
        ]
      },
      {
        "id": "food-selfie-theme-selection",
        "label": "Pilih Tema",
        "type": "choice",
        "defaultValue": "studio-clean",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "studio-clean",
            "label": "Studio Clean"
          },
          {
            "value": "magazine-editorial",
            "label": "Magazine Editorial"
          },
          {
            "value": "flat-lay",
            "label": "Flat Lay"
          },
          {
            "value": "dark-moody",
            "label": "Dark Moody"
          },
          {
            "value": "bright-airy",
            "label": "Bright & Airy"
          },
          {
            "value": "marble-gold",
            "label": "Marble & Gold"
          },
          {
            "value": "b-w-artistic",
            "label": "B&W Artistic"
          },
          {
            "value": "fine-dining",
            "label": "Fine Dining"
          },
          {
            "value": "modern-cafe",
            "label": "Modern Cafe"
          },
          {
            "value": "coffee-shop",
            "label": "Coffee Shop"
          },
          {
            "value": "hotel-luxury",
            "label": "Hotel Luxury"
          },
          {
            "value": "asian-style",
            "label": "Asian Style"
          },
          {
            "value": "bakery-display",
            "label": "Bakery Display"
          },
          {
            "value": "dessert-bar",
            "label": "Dessert Bar"
          },
          {
            "value": "street-food",
            "label": "Street Food"
          },
          {
            "value": "food-truck",
            "label": "Food Truck"
          },
          {
            "value": "outdoor-picnic",
            "label": "Outdoor Picnic"
          },
          {
            "value": "tropical-beach",
            "label": "Tropical Beach"
          },
          {
            "value": "mediterranean",
            "label": "Mediterranean"
          },
          {
            "value": "garden-fresh",
            "label": "Garden Fresh"
          },
          {
            "value": "farm-to-table",
            "label": "Farm to Table"
          },
          {
            "value": "home-kitchen",
            "label": "Home Kitchen"
          },
          {
            "value": "rustic-vintage",
            "label": "Rustic Vintage"
          },
          {
            "value": "industrial-loft",
            "label": "Industrial Loft"
          },
          {
            "value": "japanese-zen",
            "label": "Japanese Zen"
          },
          {
            "value": "neon-cyberpunk",
            "label": "Neon Cyberpunk"
          },
          {
            "value": "retro-film",
            "label": "Retro Film"
          },
          {
            "value": "bokeh-dreamy",
            "label": "Bokeh Dreamy"
          },
          {
            "value": "pastel-dreamy",
            "label": "Pastel Dreamy"
          },
          {
            "value": "golden-hour",
            "label": "Golden Hour"
          },
          {
            "value": "rainy-day",
            "label": "Rainy Day"
          },
          {
            "value": "fireplace-cozy",
            "label": "Fireplace Cozy"
          },
          {
            "value": "smoke-steam",
            "label": "Smoke & Steam"
          },
          {
            "value": "mirror-reflection",
            "label": "Mirror Reflection"
          },
          {
            "value": "color-pop",
            "label": "Color Pop"
          },
          {
            "value": "icy-frozen",
            "label": "Icy Frozen"
          },
          {
            "value": "summer-sunset",
            "label": "Summer Sunset"
          },
          {
            "value": "geometric-modern",
            "label": "Geometric Modern"
          },
          {
            "value": "underwater",
            "label": "Underwater"
          },
          {
            "value": "POV one hand holding food naturally, personal perspective angle",
            "label": "POV Satu Tangan"
          },
          {
            "value": "pov-2-tangan",
            "label": "POV 2 Tangan"
          },
          {
            "value": "custom",
            "label": "Custom Theme"
          },
          {
            "value": "",
            "label": "No Theme"
          }
        ]
      },
      {
        "id": "food-selfie-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a natural food selfie using the uploaded food and model references. Keep the food recognizable and apply the selected scene.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "food-ramadan",
        "label": "Tema Ramadan",
        "description": "Susun foto makanan dengan tema Ramadan.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "food-ramadan-food-file-input",
            "label": "Unggah Foto Makanan",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "food-ramadan-model-input",
            "label": "Pilih Foto Model/Orang Orang ini akan muncul di foto dengan makanan",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "food-ramadan-custom-theme-input",
            "label": "✨ Tulis Tema Custom Anda:",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: suasana masjid dengan lampu gantung, meja buka puasa keluarga di teras rumah, dekorasi ketupat dan lampu hias...",
            "role": "prompt"
          },
          {
            "id": "food-ramadan-background-input",
            "label": "Pilih Background Custom",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "food-ramadan-style-file-input",
            "label": "Referensi (Opsional)",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "food-ramadan-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "food-ramadan",
            "required": false,
            "options": [
              {
                "value": "food-selfie",
                "label": "Foto Makanan"
              },
              {
                "value": "food-ramadan",
                "label": "Tema Ramadan"
              }
            ]
          },
          {
            "id": "food-ramadan-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1 (Instagram Post)"
              },
              {
                "value": "4:5",
                "label": "4:5 (Instagram Feed)"
              },
              {
                "value": "9:16",
                "label": "9:16 (Stories/Reels)"
              },
              {
                "value": "3:4",
                "label": "3:4 (Portrait)"
              },
              {
                "value": "2:3",
                "label": "2:3 (Pinterest)"
              },
              {
                "value": "16:9",
                "label": "16:9 (YouTube)"
              },
              {
                "value": "3:2",
                "label": "3:2 (Kamera DSLR)"
              },
              {
                "value": "4:3",
                "label": "4:3 (Klasik)"
              },
              {
                "value": "21:9",
                "label": "21:9 (Cinematic)"
              },
              {
                "value": "5:4",
                "label": "5:4 (Cetak/Menu)"
              }
            ]
          },
          {
            "id": "food-ramadan-theme-selection",
            "label": "Pilih Tema",
            "type": "choice",
            "defaultValue": "buka-puasa",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "buka-puasa",
                "label": "Buka Puasa"
              },
              {
                "value": "flat-lay-takjil",
                "label": "Flat Lay Takjil"
              },
              {
                "value": "kurma-premium",
                "label": "Kurma Premium"
              },
              {
                "value": "lantern-ramadan",
                "label": "Lantern Ramadan"
              },
              {
                "value": "sahur-subuh",
                "label": "Sahur Subuh"
              },
              {
                "value": "es-minuman-buka",
                "label": "Es & Minuman Buka"
              },
              {
                "value": "bukber-restoran",
                "label": "Bukber Restoran"
              },
              {
                "value": "pasar-takjil",
                "label": "Pasar Takjil"
              },
              {
                "value": "ketupat-opor",
                "label": "Ketupat & Opor"
              },
              {
                "value": "kue-lebaran",
                "label": "Kue Lebaran"
              },
              {
                "value": "hampers-lebaran",
                "label": "Hampers Lebaran"
              },
              {
                "value": "open-house-lebaran",
                "label": "Open House Lebaran"
              },
              {
                "value": "custom",
                "label": "Custom Theme"
              }
            ]
          },
          {
            "id": "food-ramadan-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a Ramadan-themed food photograph from the uploaded dish, using the chosen atmosphere and setting.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "product-review",
    "label": "Review Generator",
    "description": "Bangun adegan review produk dengan referensi produk dan model.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "review-image-input",
        "label": "Klik atau seret gambar ke sini PNG, JPG, WEBP (Bisa lebih dari satu)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "review-product-desc-input",
        "label": "Deskripsi Produk",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Deskripsikan produk Anda secara detail... atau gunakan AI Generate",
        "role": "prompt"
      },
      {
        "id": "review-model-image-input",
        "label": "Klik untuk pilih foto model",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "review-photo-theme-input",
        "label": "Tema Foto (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Minimalis & bersih, nuansa alam tropis, futuristik dengan neon...",
        "role": "prompt"
      },
      {
        "id": "product-review-choice-1",
        "label": "Produk",
        "type": "choice",
        "defaultValue": "product-review",
        "required": false,
        "options": [
          {
            "value": "product-review",
            "label": "Review Produk"
          },
          {
            "value": "skincare-review",
            "label": "Review Skincare"
          },
          {
            "value": "food-review",
            "label": "Review Makanan"
          },
          {
            "value": "product-ads",
            "label": "Story Iklan"
          },
          {
            "value": "unboxing-scene",
            "label": "Unboxing"
          },
          {
            "value": "before-after",
            "label": "Before/After"
          }
        ]
      },
      {
        "id": "review-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 Square"
          },
          {
            "value": "16:9",
            "label": "16:9 Landscape"
          },
          {
            "value": "3:4",
            "label": "3:4 Portrait"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          }
        ]
      },
      {
        "id": "review-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a visually coherent product-review scene from the supplied product and model images. Show the selected use case without inventing product performance claims.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "skincare-review",
        "label": "Skincare Review",
        "description": "Buat adegan review skincare dan cara penggunaan produk.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "skincare-image-input",
            "label": "Klik atau seret gambar produk PNG, JPG, WEBP, HEIC (Bisa lebih dari satu)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "multiple": true,
            "role": "image"
          },
          {
            "id": "skincare-product-desc-input",
            "label": "Deskripsi Skincare",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Deskripsikan produk skincare Anda: jenis produk, manfaat, bahan utama, tekstur...",
            "role": "prompt"
          },
          {
            "id": "skincare-model-image-input",
            "label": "Upload foto reviewer/model",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "skincare-photo-theme-input",
            "label": "Pilih Tema Review",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Clean & minimalis dengan background putih, aesthetic pink vibes, natural lighting outdoor...",
            "role": "prompt"
          },
          {
            "id": "skincare-review-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "skincare-review",
            "required": false,
            "options": [
              {
                "value": "product-review",
                "label": "Review Produk"
              },
              {
                "value": "skincare-review",
                "label": "Review Skincare"
              },
              {
                "value": "food-review",
                "label": "Review Makanan"
              },
              {
                "value": "product-ads",
                "label": "Story Iklan"
              },
              {
                "value": "unboxing-scene",
                "label": "Unboxing"
              },
              {
                "value": "before-after",
                "label": "Before/After"
              }
            ]
          },
          {
            "id": "skincare-theme-selection",
            "label": "Pilih Tema Review",
            "type": "choice",
            "defaultValue": "professional-commercial",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "professional-commercial",
                "label": "Professional Commercial Iklan produk profesional & mewah"
              },
              {
                "value": "problem-solution",
                "label": "Problem & Solution Before-after masalah kulit"
              },
              {
                "value": "honest-ugc",
                "label": "Honest UGC Review Review jujur ala pengguna"
              },
              {
                "value": "the-battle-vs",
                "label": "The Battle (VS) Perbandingan 2+ produk"
              },
              {
                "value": "science-routine",
                "label": "Science & Routine Edukasi ingredients & skincare routine"
              },
              {
                "value": "aesthetic-asmr",
                "label": "Aesthetic / ASMR Visual satisfying & relaxing"
              },
              {
                "value": "custom",
                "label": "Custom Theme Tulis tema sendiri sesuai kebutuhan"
              }
            ]
          },
          {
            "id": "skincare-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1 Square"
              },
              {
                "value": "16:9",
                "label": "16:9 Landscape"
              },
              {
                "value": "3:4",
                "label": "3:4 Portrait"
              },
              {
                "value": "9:16",
                "label": "9:16 Story"
              }
            ]
          },
          {
            "id": "skincare-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a skincare product-review scene preserving packaging and model identity. Avoid fabricated before-and-after efficacy claims.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "food-review",
        "label": "Food Review",
        "description": "Buat adegan review makanan yang menggugah selera.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "food-image-input",
            "label": "Upload 1 atau lebih foto makanan yang akan direview (maksimal 5 foto)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "multiple": true,
            "role": "image"
          },
          {
            "id": "food-product-desc-input",
            "label": "Jelaskan makanan ini (nama, rasa, tekstur, bahan, tempat, harga, dll)",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Nasi Goreng Spesial dengan telur mata sapi, ayam fillet, dan kerupuk. Rasanya gurih dan pedas pas. Harga Rp 35.000 di Warung Nasi Pak Budi...",
            "role": "prompt"
          },
          {
            "id": "food-model-image-input",
            "label": "Foto referensi",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "food-photo-theme-input",
            "label": "Atur tema atau mood visual untuk review (kosongkan jika default)",
            "type": "text",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: natural lighting, cozy cafe ambience, street food vibes, fine dining elegant, dll...",
            "role": "style"
          },
          {
            "id": "food-review-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "food-review",
            "required": false,
            "options": [
              {
                "value": "product-review",
                "label": "Review Produk"
              },
              {
                "value": "skincare-review",
                "label": "Review Skincare"
              },
              {
                "value": "food-review",
                "label": "Review Makanan"
              },
              {
                "value": "product-ads",
                "label": "Story Iklan"
              },
              {
                "value": "unboxing-scene",
                "label": "Unboxing"
              },
              {
                "value": "before-after",
                "label": "Before/After"
              }
            ]
          },
          {
            "id": "food-theme-presets",
            "label": "Atur tema atau mood visual untuk review (kosongkan jika default)",
            "type": "choice",
            "defaultValue": "warung-lokal",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "warung-lokal",
                "label": "Warung Lokal"
              },
              {
                "value": "cafe-aesthetic",
                "label": "Cafe Aesthetic"
              },
              {
                "value": "street-food-malam",
                "label": "Street Food Malam"
              },
              {
                "value": "fine-dining",
                "label": "Fine Dining"
              },
              {
                "value": "rooftop dinner, city lights bokeh, golden hour romantis",
                "label": "Rooftop Dinner"
              },
              {
                "value": "studio-vlogger",
                "label": "Studio Vlogger"
              },
              {
                "value": "mukbang-style",
                "label": "Mukbang Style"
              },
              {
                "value": "pasar-tradisional",
                "label": "Pasar Tradisional"
              }
            ]
          },
          {
            "id": "food-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1 (IG Post)"
              },
              {
                "value": "16:9",
                "label": "16:9 (Landscape)"
              },
              {
                "value": "9:16",
                "label": "9:16 (TikTok/Reels)"
              },
              {
                "value": "3:4",
                "label": "3:4 (Portrait)"
              },
              {
                "value": "4:5",
                "label": "4:5 (IG Feed)"
              },
              {
                "value": "2:3",
                "label": "2:3 (Pinterest)"
              },
              {
                "value": "3:2",
                "label": "3:2 (Kamera DSLR)"
              },
              {
                "value": "4:3",
                "label": "4:3 (Klasik)"
              },
              {
                "value": "21:9",
                "label": "21:9 (Cinematic)"
              },
              {
                "value": "5:4",
                "label": "5:4 (Cetak/Menu)"
              }
            ]
          },
          {
            "id": "food-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a food-review photograph with natural presentation, the selected model and the supplied food reference.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "product-ads",
        "label": "Generator Story Iklan",
        "description": "Susun adegan visual untuk cerita iklan produk.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "ads-image-input",
            "label": "Klik atau seret gambar ke sini PNG, JPG, WEBP (Bisa lebih dari satu)",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "multiple": true,
            "role": "image"
          },
          {
            "id": "ads-product-desc-input",
            "label": "Deskripsi Produk",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Deskripsikan produk Anda secara detail... atau gunakan AI Generate",
            "role": "prompt"
          },
          {
            "id": "ads-model-image-input",
            "label": "Klik untuk pilih foto model",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "ads-photo-theme-input",
            "label": "Tema Foto (Opsional)",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Minimalis & bersih, nuansa alam tropis, futuristik dengan neon...",
            "role": "prompt"
          },
          {
            "id": "ads-narrator-voice",
            "label": "Pilih Suara Narator",
            "type": "select",
            "defaultValue": "Puck",
            "required": false,
            "role": "voice",
            "options": [
              {
                "value": "Puck",
                "label": "🎙️ Puck - Pria, Ceria & Enerjik"
              },
              {
                "value": "Kore",
                "label": "🎙️ Kore - Wanita, Tegas & Profesional"
              },
              {
                "value": "Zephyr",
                "label": "🎙️ Zephyr - Wanita, Cerah & Ramah"
              },
              {
                "value": "Fenrir",
                "label": "🎙️ Fenrir - Pria, Bersemangat & Antusias"
              },
              {
                "value": "Achird",
                "label": "🎙️ Achird - Pria, Hangat & Bersahabat"
              },
              {
                "value": "Charon",
                "label": "🎙️ Charon - Pria, Informatif & Jelas"
              },
              {
                "value": "Sadachbia",
                "label": "🎙️ Sadachbia - Pria, Hidup & Dinamis"
              },
              {
                "value": "Sulafat",
                "label": "🎙️ Sulafat - Wanita, Hangat & Menenangkan"
              },
              {
                "value": "Aoede",
                "label": "🎙️ Aoede - Wanita, Lancar & Santai"
              },
              {
                "value": "Gacrux",
                "label": "🎙️ Gacrux - Wanita, Dewasa & Bijak"
              }
            ]
          },
          {
            "id": "product-ads-choice-1",
            "label": "Produk",
            "type": "choice",
            "defaultValue": "product-ads",
            "required": false,
            "options": [
              {
                "value": "product-review",
                "label": "Review Produk"
              },
              {
                "value": "skincare-review",
                "label": "Review Skincare"
              },
              {
                "value": "food-review",
                "label": "Review Makanan"
              },
              {
                "value": "product-ads",
                "label": "Story Iklan"
              },
              {
                "value": "unboxing-scene",
                "label": "Unboxing"
              },
              {
                "value": "before-after",
                "label": "Before/After"
              }
            ]
          },
          {
            "id": "ads-ratio-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1 Square"
              },
              {
                "value": "16:9",
                "label": "16:9 Landscape"
              },
              {
                "value": "3:4",
                "label": "3:4 Portrait"
              },
              {
                "value": "9:16",
                "label": "9:16 Story"
              }
            ]
          },
          {
            "id": "ads-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Create a product advertisement scene based on the supplied story and references. Keep product details accurate and claims grounded in supplied information.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "unboxing-scene",
        "label": "Unboxing Scene",
        "description": "Buat adegan membuka kemasan dengan produk dan model.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "unboxing-image-upload",
            "label": "Upload Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "unboxing-scene-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "unboxing-scene",
            "required": false,
            "options": [
              {
                "value": "product-review",
                "label": "Review Produk"
              },
              {
                "value": "skincare-review",
                "label": "Review Skincare"
              },
              {
                "value": "food-review",
                "label": "Review Makanan"
              },
              {
                "value": "product-ads",
                "label": "Story Iklan"
              },
              {
                "value": "unboxing-scene",
                "label": "Unboxing"
              },
              {
                "value": "before-after",
                "label": "Before/After"
              }
            ]
          },
          {
            "id": "unboxing-angle-selection",
            "label": "Camera Angle",
            "type": "choice",
            "defaultValue": "top",
            "required": false,
            "options": [
              {
                "value": "top",
                "label": "Top View"
              },
              {
                "value": "side",
                "label": "Side View"
              },
              {
                "value": "three-quarter",
                "label": "3/4 Angle"
              },
              {
                "value": "multiple",
                "label": "Multiple"
              }
            ]
          },
          {
            "id": "unboxing-style-selection",
            "label": "Unboxing Style",
            "type": "choice",
            "defaultValue": "hand-reaching",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "hand-reaching",
                "label": "Hand Reaching"
              },
              {
                "value": "hand-opening",
                "label": "Hand Opening"
              },
              {
                "value": "product-revealed",
                "label": "Product Revealed"
              },
              {
                "value": "packaging",
                "label": "With Packaging"
              }
            ]
          },
          {
            "id": "unboxing-lighting-selection",
            "label": "Lighting",
            "type": "choice",
            "defaultValue": "dramatic",
            "required": false,
            "options": [
              {
                "value": "dramatic",
                "label": "Dramatic"
              },
              {
                "value": "natural",
                "label": "Natural"
              },
              {
                "value": "soft",
                "label": "Soft"
              }
            ]
          },
          {
            "id": "unboxing-aspect-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "unboxing-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          },
          {
            "id": "unboxing-scene-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Create a realistic unboxing scene using the uploaded product and selected hands or model, packaging and background.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "before-after",
        "label": "Before/After",
        "description": "Susun dua kondisi visual dalam komposisi before/after.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "ba-before-upload",
            "label": "Upload foto \"before\" PNG, JPG, WEBP, HEIC",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "ba-transform-prompt",
            "label": "Prompt Transformasi",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Ubah lapangan ini menjadi ada bangunan hotel mewah 5 lantai dengan kolam renang",
            "role": "prompt"
          },
          {
            "id": "ba-text-prompt",
            "label": "Deskripsi Before-After",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Contoh: Buat before after dari lapangan gersang kosong menjadi kompleks hotel mewah dengan gedung 5 lantai, taman hijau, dan kolam renang",
            "role": "prompt"
          },
          {
            "id": "beforeafter-image-upload",
            "label": "Upload Foto",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "beforeafter-show-labels",
            "label": "Tampilkan",
            "type": "choice",
            "defaultValue": "yes",
            "required": false,
            "options": [
              {
                "value": "no",
                "label": "Tidak"
              },
              {
                "value": "yes",
                "label": "Ya"
              }
            ]
          },
          {
            "id": "beforeafter-show-arrows",
            "label": "Text Labels (BEFORE/AFTER)",
            "type": "choice",
            "defaultValue": "yes",
            "required": false,
            "options": [
              {
                "value": "no",
                "label": "Tidak"
              },
              {
                "value": "yes",
                "label": "Ya"
              }
            ]
          },
          {
            "id": "beforeafter-show-highlight",
            "label": "Arrow Indicators",
            "type": "choice",
            "defaultValue": "yes",
            "required": false,
            "options": [
              {
                "value": "no",
                "label": "Tidak"
              },
              {
                "value": "yes",
                "label": "Ya"
              }
            ]
          },
          {
            "id": "before-after-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "before-after",
            "required": false,
            "options": [
              {
                "value": "product-review",
                "label": "Review Produk"
              },
              {
                "value": "skincare-review",
                "label": "Review Skincare"
              },
              {
                "value": "food-review",
                "label": "Review Makanan"
              },
              {
                "value": "product-ads",
                "label": "Story Iklan"
              },
              {
                "value": "unboxing-scene",
                "label": "Unboxing"
              },
              {
                "value": "before-after",
                "label": "Before/After"
              }
            ]
          },
          {
            "id": "ba-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "ba-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          },
          {
            "id": "beforeafter-category-selection",
            "label": "Product Category",
            "type": "choice",
            "defaultValue": "skincare",
            "required": false,
            "options": [
              {
                "value": "skincare",
                "label": "Skincare"
              },
              {
                "value": "makeup",
                "label": "Makeup"
              },
              {
                "value": "hair",
                "label": "Hair Care"
              },
              {
                "value": "fitness",
                "label": "Fitness"
              },
              {
                "value": "dental",
                "label": "Dental"
              },
              {
                "value": "other",
                "label": "Other"
              }
            ]
          },
          {
            "id": "beforeafter-style-selection",
            "label": "Comparison Style",
            "type": "choice",
            "defaultValue": "split-screen",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "split-screen",
                "label": "Split Screen"
              },
              {
                "value": "slider",
                "label": "Slider Format"
              },
              {
                "value": "side-by-side",
                "label": "Side-by-Side"
              },
              {
                "value": "stacked",
                "label": "Stacked"
              }
            ]
          },
          {
            "id": "beforeafter-aspect-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          }
        ],
        "promptIntent": "Create a clearly labelled before-and-after composition from the supplied references and requested transformation. Do not infer unprovided efficacy or outcomes.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "testimonial-generator",
        "label": "Testimonial Card",
        "description": "Susun kartu testimoni dari teks dan identitas yang diberikan.",
        "iconId": "camera",
        "group": "ugc",
        "kind": "image",
        "fields": [
          {
            "id": "testimonial-image-upload",
            "label": "Upload Foto Produk",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "testimonial-product-name",
            "label": "Product Name (Optional)",
            "type": "text",
            "defaultValue": "",
            "required": false,
            "placeholder": "e.g., Skincare Serum, Coffee, etc."
          },
          {
            "id": "testimonial-product-category",
            "label": "Product Category (Optional)",
            "type": "text",
            "defaultValue": "",
            "required": false,
            "placeholder": "e.g., Beauty, Food & Beverage, etc."
          },
          {
            "id": "testimonial-customer-name",
            "label": "Customer Name",
            "type": "text",
            "defaultValue": "",
            "required": false,
            "placeholder": "e.g., Sarah Johnson"
          },
          {
            "id": "testimonial-custom-text",
            "label": "Testimonial Text",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Write testimonial...",
            "role": "prompt"
          },
          {
            "id": "testimonial-rating-selection",
            "label": "Rating",
            "type": "choice",
            "defaultValue": "5",
            "required": false,
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              }
            ]
          },
          {
            "id": "testimonial-style-selection",
            "label": "Card Style",
            "type": "choice",
            "defaultValue": "modern",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "modern",
                "label": "Modern Card"
              },
              {
                "value": "quote",
                "label": "Quote Bubble"
              },
              {
                "value": "instagram",
                "label": "IG Story"
              },
              {
                "value": "professional",
                "label": "Professional"
              }
            ]
          },
          {
            "id": "testimonial-mode-selection",
            "label": "Content Mode",
            "type": "choice",
            "defaultValue": "ai",
            "required": false,
            "options": [
              {
                "value": "ai",
                "label": "AI Generate"
              },
              {
                "value": "custom",
                "label": "Custom Text"
              }
            ]
          },
          {
            "id": "testimonial-aspect-selection",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "4:5",
                "label": "4:5"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "testimonial-count-selection",
            "label": "Jumlah Variasi",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "4",
                "label": "4 Cards"
              },
              {
                "value": "6",
                "label": "6 Cards"
              },
              {
                "value": "8",
                "label": "8 Cards"
              }
            ]
          }
        ],
        "promptIntent": "Design a testimonial card using only the supplied quote, attribution and brand details. Do not invent customer testimonials.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "size-guide",
    "label": "Size Guide",
    "description": "Buat panduan ukuran produk yang mudah dibaca.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "sizeguide-image-upload",
        "label": "Upload Product Photo",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "sizeguide-width",
        "label": "Width (cm)",
        "type": "number",
        "defaultValue": 0,
        "required": false,
        "placeholder": "10"
      },
      {
        "id": "sizeguide-height",
        "label": "Height (cm)",
        "type": "number",
        "defaultValue": 0,
        "required": false,
        "placeholder": "15"
      },
      {
        "id": "sizeguide-depth",
        "label": "Depth (cm)",
        "type": "number",
        "defaultValue": 0,
        "required": false,
        "placeholder": "5"
      },
      {
        "id": "sizeguide-comparison-selection",
        "label": "Select Comparison Object",
        "type": "choice",
        "defaultValue": "hand",
        "required": false,
        "options": [
          {
            "value": "hand",
            "label": "Hand"
          },
          {
            "value": "coin",
            "label": "Coin"
          },
          {
            "value": "ruler",
            "label": "Ruler"
          },
          {
            "value": "bottle",
            "label": "Water Bottle"
          },
          {
            "value": "phone",
            "label": "Smartphone"
          },
          {
            "value": "card",
            "label": "Credit Card"
          }
        ]
      },
      {
        "id": "sizeguide-style-selection",
        "label": "Guide Style",
        "type": "choice",
        "defaultValue": "side-by-side",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "side-by-side",
            "label": "Side by Side"
          },
          {
            "value": "overlay",
            "label": "Overlay"
          },
          {
            "value": "dimension-lines",
            "label": "Dimension Lines"
          },
          {
            "value": "infographic",
            "label": "Infographic"
          }
        ]
      },
      {
        "id": "sizeguide-aspect-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 Square"
          },
          {
            "value": "3:4",
            "label": "3:4 Portrait"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          }
        ]
      },
      {
        "id": "sizeguide-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "size-guide-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Design a clear product-size guide from the supplied measurements and units. Use only supplied dimensions and preserve the product reference.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "sketch-catalog",
    "label": "Sketsa ke Katalog",
    "description": "Ubah sketsa desain menjadi foto katalog produk.",
    "iconId": "camera",
    "group": "ugc",
    "kind": "image",
    "fields": [
      {
        "id": "sketch-input",
        "label": "✏️ Klik untuk upload sketsa Sketsa gaun, kerudung, jersey, sepatu, atau produk lainnya",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "sketch-custom-product-input",
        "label": "✨ Tulis Jenis Produk Anda:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: sajadah, tas rajut, sarung bantal, mainan kayu..."
      },
      {
        "id": "sketch-custom-style-input",
        "label": "✨ Tulis Style Katalog Anda:",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: katalog gaya Korea minimalis dengan properti bunga kering, background krem estetik, nuansa hangat...",
        "role": "prompt"
      },
      {
        "id": "sketch-product-type-options",
        "label": "Jenis Produk",
        "type": "choice",
        "defaultValue": "dress",
        "required": false,
        "options": [
          {
            "value": "dress",
            "label": "Dress/Gaun"
          },
          {
            "value": "shirt",
            "label": "Shirt/Kaos"
          },
          {
            "value": "jersey",
            "label": "Jersey/Olahraga"
          },
          {
            "value": "pants",
            "label": "Celana"
          },
          {
            "value": "jacket",
            "label": "Jaket/Outer"
          },
          {
            "value": "shoes",
            "label": "Sepatu"
          },
          {
            "value": "bag",
            "label": "Tas"
          },
          {
            "value": "accessories",
            "label": "Aksesoris"
          },
          {
            "value": "hijab",
            "label": "Kerudung/Hijab"
          },
          {
            "value": "gamis",
            "label": "Gamis/Abaya"
          },
          {
            "value": "mukena",
            "label": "Mukena"
          },
          {
            "value": "koko",
            "label": "Baju Koko"
          },
          {
            "value": "skirt",
            "label": "Rok"
          },
          {
            "value": "hat",
            "label": "Topi/Peci"
          },
          {
            "value": "batik",
            "label": "Batik"
          },
          {
            "value": "kids",
            "label": "Baju Anak"
          },
          {
            "value": "other",
            "label": "Produk Lain"
          }
        ]
      },
      {
        "id": "sketch-catalog-style-options",
        "label": "Style Katalog",
        "type": "choice",
        "defaultValue": "studio-white",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "studio-white",
            "label": "Studio White BG"
          },
          {
            "value": "mannequin",
            "label": "Mannequin"
          },
          {
            "value": "model-pro",
            "label": "Model Profesional"
          },
          {
            "value": "flat-lay",
            "label": "Flat Lay"
          },
          {
            "value": "lifestyle",
            "label": "Lifestyle Setting"
          },
          {
            "value": "hanger",
            "label": "On Hanger"
          },
          {
            "value": "ghost",
            "label": "Ghost Mannequin"
          },
          {
            "value": "outdoor",
            "label": "Outdoor Scene"
          },
          {
            "value": "luxury-premium",
            "label": "Luxury Premium"
          },
          {
            "value": "editorial-fashion",
            "label": "Editorial Fashion"
          },
          {
            "value": "street-style",
            "label": "Street Style Urban"
          },
          {
            "value": "minimal-modern",
            "label": "Minimal Modern"
          },
          {
            "value": "vintage-classic",
            "label": "Vintage Classic"
          },
          {
            "value": "creative-artistic",
            "label": "Creative Artistic"
          },
          {
            "value": "sports-performance",
            "label": "Sports Performance"
          },
          {
            "value": "ecommerce-clean",
            "label": "E-commerce Clean"
          },
          {
            "value": "boutique-display",
            "label": "Boutique Display"
          },
          {
            "value": "fashion-week",
            "label": "Fashion Week"
          },
          {
            "value": "magazine-cover",
            "label": "Magazine Cover"
          },
          {
            "value": "social-media",
            "label": "Social Media"
          },
          {
            "value": "custom",
            "label": "Custom Style"
          }
        ]
      },
      {
        "id": "sketch-angle-options",
        "label": "Sudut Pandang",
        "type": "choice",
        "defaultValue": "front",
        "required": false,
        "options": [
          {
            "value": "front",
            "label": "Depan"
          },
          {
            "value": "back",
            "label": "Belakang"
          },
          {
            "value": "side",
            "label": "Samping"
          },
          {
            "value": "3-4-view",
            "label": "3/4 View"
          },
          {
            "value": "detail",
            "label": "Detail Close-up"
          },
          {
            "value": "full-360",
            "label": "Multiple Angles"
          }
        ]
      },
      {
        "id": "sketch-background-options",
        "label": "Background",
        "type": "choice",
        "defaultValue": "pure-white",
        "required": false,
        "options": [
          {
            "value": "pure-white",
            "label": "Pure White"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          },
          {
            "value": "studio-gray",
            "label": "Studio Gray"
          },
          {
            "value": "natural",
            "label": "Natural Setting"
          }
        ]
      },
      {
        "id": "sketch-lighting-options",
        "label": "Pencahayaan",
        "type": "choice",
        "defaultValue": "studio-soft",
        "required": false,
        "options": [
          {
            "value": "studio-soft",
            "label": "Studio Soft"
          },
          {
            "value": "high-key",
            "label": "High Key Bright"
          },
          {
            "value": "dramatic",
            "label": "Dramatic"
          },
          {
            "value": "natural-light",
            "label": "Natural Light"
          }
        ]
      },
      {
        "id": "sketch-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "sketch-count-selection",
        "label": "Jumlah Foto",
        "type": "choice",
        "defaultValue": "6",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Turn the supplied sketch into a realistic catalog product photograph. Preserve the intended design, materials, colors and selected presentation.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "family",
    "label": "Foto Keluarga",
    "description": "Satukan referensi anggota keluarga dalam foto bertema.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "family-people",
        "label": "Foto anggota keluarga",
        "type": "file",
        "required": true,
        "defaultValue": "",
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "family-background-input",
        "label": "Pilih Background PNG, JPG, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "family-custom-theme-input",
        "label": "Atau Tulis Tema Custom (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: keluarga di taman bunga dengan suasana musim semi...",
        "role": "prompt"
      },
      {
        "id": "family-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "family-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "family-theme",
        "label": "Tema foto",
        "type": "choice",
        "defaultValue": "pasangan-sofa",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "pasangan-sofa",
            "label": "Pasangan Sofa"
          },
          {
            "value": "ruang-tamu-lebaran",
            "label": "Ruang Tamu Lebaran"
          },
          {
            "value": "mudik-kampung",
            "label": "Mudik Kampung"
          },
          {
            "value": "halaman-masjid",
            "label": "Halaman Masjid"
          },
          {
            "value": "meja-makan-lebaran",
            "label": "Meja Makan Lebaran"
          },
          {
            "value": "taman-bunga-lebaran",
            "label": "Taman Bunga Lebaran"
          },
          {
            "value": "pantai",
            "label": "Pantai"
          },
          {
            "value": "piknik",
            "label": "Piknik"
          },
          {
            "value": "gunung",
            "label": "Gunung"
          },
          {
            "value": "foto realistis keluarga di ruang tamu modern yang nyaman",
            "label": "Ruang Tamu"
          },
          {
            "value": "studio-foto",
            "label": "Studio Foto"
          },
          {
            "value": "taman-bunga",
            "label": "Taman Bunga"
          },
          {
            "value": "foto realistis keluarga sedang memasak bersama di dapur modern",
            "label": "Dapur"
          },
          {
            "value": "foto realistis keluarga sedang bermain board game di meja makan",
            "label": "Game Night"
          },
          {
            "value": "perpustakaan",
            "label": "Perpustakaan"
          },
          {
            "value": "berkebun",
            "label": "Berkebun"
          },
          {
            "value": "foto realistis keluarga sedang bersepeda di taman kota sore hari",
            "label": "Bersepeda"
          },
          {
            "value": "foto realistis keluarga sedang camping di hutan dengan tenda",
            "label": "Camping"
          },
          {
            "value": "foto realistis keluarga di depan menara Eiffel Paris",
            "label": "Paris"
          },
          {
            "value": "foto realistis keluarga di Masjidil Haram saat umroh",
            "label": "Umroh"
          },
          {
            "value": "foto realistis keluarga di Gunung Fuji Jepang dengan sakura",
            "label": "Jepang"
          },
          {
            "value": "foto realistis keluarga di pantai Bali dengan sunset orange",
            "label": "Bali"
          },
          {
            "value": "foto realistis keluarga di Colosseum Roma Italia",
            "label": "Roma"
          },
          {
            "value": "dubai",
            "label": "Dubai"
          },
          {
            "value": "raja-ratu",
            "label": "Raja/Ratu"
          },
          {
            "value": "ksatria",
            "label": "Ksatria"
          },
          {
            "value": "superhero",
            "label": "Superhero"
          },
          {
            "value": "foto realistis keluarga bergaya astronot di stasiun luar angkasa",
            "label": "Astronot"
          },
          {
            "value": "foto realistis keluarga bergaya bajak laut di kapal laut",
            "label": "Bajak Laut"
          },
          {
            "value": "mafia",
            "label": "Mafia"
          }
        ]
      }
    ],
    "promptIntent": "Create a cohesive family photograph from all supplied people references. Preserve each person's identity and apply the chosen theme, clothing and background.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "new-born",
    "label": "New Born Studio",
    "description": "Buat foto studio bayi dengan tema, busana, dan properti.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "new-born-image-upload",
        "label": "Foto referensi",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "new-born-ref-upload",
        "label": "Gambar Referensi (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "new-born-name",
        "label": "Nama Bayi (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Budi"
      },
      {
        "id": "new-born-dob",
        "label": "Tanggal Lahir (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false
      },
      {
        "id": "new-born-custom-theme",
        "label": "Tema Custom (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: superhero cilik dengan kostum warna cerah...",
        "role": "prompt"
      },
      {
        "id": "new-born-composite-toggle",
        "label": "Tema Custom (Opsional)",
        "type": "choice",
        "defaultValue": "no",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "new-born-weight",
        "label": "Berat (kg, opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "3.2"
      },
      {
        "id": "new-born-length",
        "label": "Panjang (cm, opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "49"
      },
      {
        "id": "new-born-mode-selection",
        "label": "New Born Mode Selection",
        "type": "choice",
        "defaultValue": "tema",
        "required": false,
        "options": [
          {
            "value": "tema",
            "label": "Foto Tema"
          },
          {
            "value": "milestone",
            "label": "Milestone Bulanan"
          },
          {
            "value": "kartu",
            "label": "Kartu Ucapan"
          }
        ]
      },
      {
        "id": "new-born-gender",
        "label": "Jenis kelamin",
        "type": "choice",
        "defaultValue": "laki-laki",
        "required": false,
        "options": [
          {
            "value": "laki-laki",
            "label": "Laki-laki"
          },
          {
            "value": "perempuan",
            "label": "Perempuan"
          }
        ]
      },
      {
        "id": "newborn-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "new-born-theme-cat-selection",
        "label": "Pilih Kategori Tema",
        "type": "choice",
        "defaultValue": "random",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "random",
            "label": "Acak (Semua Tema)"
          },
          {
            "value": "profesi",
            "label": "Profesi Cilik"
          },
          {
            "value": "dongeng",
            "label": "Dongeng & Fantasi"
          },
          {
            "value": "adat",
            "label": "Adat Nusantara"
          },
          {
            "value": "islami",
            "label": "Islami & Aqiqah"
          },
          {
            "value": "seasonal",
            "label": "Seasonal & Perayaan"
          },
          {
            "value": "zodiak",
            "label": "Zodiak (dari Tgl Lahir)"
          }
        ]
      },
      {
        "id": "new-born-milestone-age-grid",
        "label": "Usia Milestone (bulan)",
        "type": "choice",
        "defaultValue": "newborn",
        "required": false,
        "options": [
          {
            "value": "newborn",
            "label": "Newborn"
          },
          {
            "value": "100hari",
            "label": "100 Hari"
          },
          {
            "value": "1tahun",
            "label": "1 Tahun"
          },
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          },
          {
            "value": "11",
            "label": "11"
          },
          {
            "value": "12",
            "label": "12"
          }
        ]
      },
      {
        "id": "new-born-milestone-props-grid",
        "label": "Gaya Properti",
        "type": "choice",
        "defaultValue": "random",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "random",
            "label": "Acak"
          },
          {
            "value": "rajut",
            "label": "Bantal Rajut"
          },
          {
            "value": "kayu",
            "label": "Kartu Kayu"
          },
          {
            "value": "balon",
            "label": "Balon Pastel"
          },
          {
            "value": "bunga",
            "label": "Bunga & Karangan"
          }
        ]
      },
      {
        "id": "new-born-kartu-style-grid",
        "label": "Gaya Kartu",
        "type": "choice",
        "defaultValue": "pastel",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "pastel",
            "label": "Elegan Pastel"
          },
          {
            "value": "aqiqah",
            "label": "Islami / Aqiqah"
          },
          {
            "value": "floral",
            "label": "Floral"
          },
          {
            "value": "minimalis",
            "label": "Minimalis"
          }
        ]
      },
      {
        "id": "new-born-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a gentle newborn studio portrait using the baby's uploaded face as the identity reference and the selected theme, clothing and props.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "maternity",
    "label": "Foto Maternity",
    "description": "Buat potret maternity dengan gaya dan suasana pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "maternity-custom-theme",
        "label": "Pilih Tema",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Deskripsikan tema custom Anda, misalnya: 'foto di taman bunga dengan dress putih panjang, golden hour lighting'",
        "role": "prompt"
      },
      {
        "id": "maternity-theme-options",
        "label": "Pilih Tema",
        "type": "choice",
        "defaultValue": "elegant-indoor",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "elegant-indoor",
            "label": "Elegant Indoor"
          },
          {
            "value": "outdoor-nature",
            "label": "Outdoor Nature"
          },
          {
            "value": "studio-classic",
            "label": "Studio Classic"
          },
          {
            "value": "bohemian",
            "label": "Bohemian"
          },
          {
            "value": "modern-minimalist",
            "label": "Modern Minimal"
          },
          {
            "value": "romantic-sunset",
            "label": "Romantic Sunset"
          },
          {
            "value": "beach-casual",
            "label": "Beach Casual"
          },
          {
            "value": "custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "maternity-style-options",
        "label": "Pilih Style",
        "type": "choice",
        "defaultValue": "soft-dreamy",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "soft-dreamy",
            "label": "Soft & Dreamy"
          },
          {
            "value": "bold-dramatic",
            "label": "Bold & Dramatic"
          },
          {
            "value": "natural-warm",
            "label": "Natural & Warm"
          },
          {
            "value": "artistic-creative",
            "label": "Artistic"
          }
        ]
      },
      {
        "id": "maternity-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "maternity-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create an elegant maternity portrait preserving the uploaded person's identity and applying the chosen clothing, pose and environment.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "profesi-anak",
    "label": "Foto Profesi Anak",
    "description": "Bayangkan anak dalam studio profesi dengan tema pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "profesi-child-upload",
        "label": "👦 Klik untuk upload foto anak Format: JPG, PNG, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "profesi-age-select",
        "label": "Umur Anak",
        "type": "select",
        "defaultValue": "7",
        "required": false,
        "options": [
          {
            "value": "3",
            "label": "3 tahun"
          },
          {
            "value": "4",
            "label": "4 tahun"
          },
          {
            "value": "5",
            "label": "5 tahun"
          },
          {
            "value": "6",
            "label": "6 tahun"
          },
          {
            "value": "7",
            "label": "7 tahun"
          },
          {
            "value": "8",
            "label": "8 tahun"
          },
          {
            "value": "9",
            "label": "9 tahun"
          },
          {
            "value": "10",
            "label": "10 tahun"
          }
        ]
      },
      {
        "id": "profesi-theme-input",
        "label": "Tema Profesi (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: dokter, pilot, chef, astronot...",
        "role": "style"
      },
      {
        "id": "profesi-comp-name",
        "label": "Nama Anak",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Little Bima"
      },
      {
        "id": "profesi-comp-phrase1",
        "label": "Kosongkan = teks default sesuai tema",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Nama (contoh: Little Bima)"
      },
      {
        "id": "profesi-comp-phrase2",
        "label": "Kosongkan = teks default sesuai tema",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tagline (contoh: fly high)"
      },
      {
        "id": "profesi-comp-age",
        "label": "Umur Anak",
        "type": "select",
        "defaultValue": "6",
        "required": false,
        "options": [
          {
            "value": "3",
            "label": "3 tahun"
          },
          {
            "value": "4",
            "label": "4 tahun"
          },
          {
            "value": "5",
            "label": "5 tahun"
          },
          {
            "value": "6",
            "label": "6 tahun"
          },
          {
            "value": "7",
            "label": "7 tahun"
          },
          {
            "value": "8",
            "label": "8 tahun"
          },
          {
            "value": "9",
            "label": "9 tahun"
          },
          {
            "value": "10",
            "label": "10 tahun"
          }
        ]
      },
      {
        "id": "profesi-comp-custom-theme",
        "label": "Tema Composite",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Atau tulis tema sendiri (contoh: pembalap, koki sushi, penyihir)...",
        "role": "style"
      },
      {
        "id": "profesi-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "9:16",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "9:16",
            "label": "9:16 (Portrait)"
          },
          {
            "value": "16:9",
            "label": "16:9 (Landscape)"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "1:1",
            "label": "1:1"
          }
        ]
      },
      {
        "id": "profesi-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "profesi-comp-gender",
        "label": "Jenis Kelamin",
        "type": "choice",
        "defaultValue": "male",
        "required": false,
        "options": [
          {
            "value": "male",
            "label": "Laki-laki"
          },
          {
            "value": "female",
            "label": "Perempuan"
          }
        ]
      },
      {
        "id": "profesi-comp-theme-grid",
        "label": "Tema Composite",
        "type": "choice",
        "defaultValue": "pilot",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "pilot",
            "label": "✈️ Pilot"
          },
          {
            "value": "astronaut",
            "label": "🚀 Astronot"
          },
          {
            "value": "princess",
            "label": "👸 Putri"
          },
          {
            "value": "superhero",
            "label": "🦸 Superhero"
          },
          {
            "value": "chef",
            "label": "🍳 Chef"
          },
          {
            "value": "explorer",
            "label": "🌍 Explorer"
          },
          {
            "value": "doctor",
            "label": "🩺 Dokter"
          },
          {
            "value": "firefighter",
            "label": "🚒 Pemadam"
          },
          {
            "value": "police",
            "label": "👮 Polisi"
          },
          {
            "value": "ballerina",
            "label": "👩‍🎨 Balerina"
          },
          {
            "value": "footballer",
            "label": "⚽ Pesepakbola"
          },
          {
            "value": "musician",
            "label": "🎸 Musisi"
          }
        ]
      },
      {
        "id": "profesi-comp-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "4:5",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:2",
            "label": "3:2"
          }
        ]
      },
      {
        "id": "profesi-comp-count-grid",
        "label": "Jumlah komposisi",
        "type": "choice",
        "defaultValue": "1",
        "required": false,
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "profesi-anak-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a playful child-profession portrait preserving the uploaded child's identity. Use the chosen profession, backdrop and layout.",
    "isNew": true,
    "hidden": false
  },
  {
    "id": "wedding",
    "label": "Wedding Studio",
    "description": "Buat foto pasangan untuk studio pernikahan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "wedding-male-upload",
        "label": "🤵 Klik untuk upload foto pria Format: JPG, PNG, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "wedding-female-upload",
        "label": "👰 Klik untuk upload foto wanita Format: JPG, PNG, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "wedding-theme-input",
        "label": "Tema Foto (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: di pantai saat matahari terbenam, fairytale castle ballroom, vintage 1920s style, rustic barn with fairy lights...",
        "role": "prompt"
      },
      {
        "id": "wedding-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "wedding",
        "required": false,
        "options": [
          {
            "value": "wedding",
            "label": "Foto Wedding"
          },
          {
            "value": "wedding-design",
            "label": "Desain Dekorasi"
          }
        ]
      },
      {
        "id": "wedding-type-options",
        "label": "Jenis Foto",
        "type": "choice",
        "defaultValue": "wedding",
        "required": false,
        "options": [
          {
            "value": "wedding",
            "label": "Wedding"
          },
          {
            "value": "prewedding",
            "label": "Pre-wedding"
          }
        ]
      },
      {
        "id": "wedding-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "9:16",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "9:16",
            "label": "9:16 (Portrait)"
          },
          {
            "value": "16:9",
            "label": "16:9 (Landscape)"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "1:1",
            "label": "1:1"
          }
        ]
      },
      {
        "id": "wedding-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a wedding portrait using the supplied couple references, selected clothing, setting and composition. Preserve both identities.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "wedding-design",
        "label": "Desain Pernikahan",
        "description": "Susun desain visual pernikahan sesuai detail acara.",
        "iconId": "users",
        "group": "family-lifestyle",
        "kind": "image",
        "fields": [
          {
            "id": "wedding-design-upload",
            "label": "Klik untuk upload Sketsa ruangan atau background venue",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "wedding-design-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "wedding-design",
            "required": false,
            "options": [
              {
                "value": "wedding",
                "label": "Foto Wedding"
              },
              {
                "value": "wedding-design",
                "label": "Desain Dekorasi"
              }
            ]
          },
          {
            "id": "wedding-design-theme-options",
            "label": "Tema Pernikahan",
            "type": "choice",
            "defaultValue": "javanese-traditional",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "javanese-traditional",
                "label": "Jawa Tradisional"
              },
              {
                "value": "sundanese-traditional",
                "label": "Sunda Tradisional"
              },
              {
                "value": "minang-traditional",
                "label": "Minang Tradisional"
              },
              {
                "value": "balinese-traditional",
                "label": "Bali Tradisional"
              },
              {
                "value": "modern-elegant",
                "label": "Modern Elegant"
              },
              {
                "value": "rustic-garden",
                "label": "Rustic Garden"
              },
              {
                "value": "luxury-gold",
                "label": "Luxury Gold"
              },
              {
                "value": "islamic-akad",
                "label": "Islamic Akad"
              }
            ]
          },
          {
            "id": "wedding-design-frame-options",
            "label": "Bingkai Dekorasi",
            "type": "choice",
            "defaultValue": "frame-top",
            "required": false,
            "options": [
              {
                "value": "frame-top",
                "label": "Bingkai Atas"
              },
              {
                "value": "frame-middle",
                "label": "Bingkai Tengah"
              },
              {
                "value": "frame-bottom",
                "label": "Bingkai Bawah"
              },
              {
                "value": "frame-jumblak",
                "label": "Katak Jumblak"
              },
              {
                "value": "frame-full",
                "label": "Full Frame"
              },
              {
                "value": "frame-minimal",
                "label": "Minimal Frame"
              }
            ]
          },
          {
            "id": "wedding-design-light-options",
            "label": "Lampu Hias",
            "type": "choice",
            "defaultValue": "chandelier-crystal",
            "required": false,
            "options": [
              {
                "value": "chandelier-crystal",
                "label": "Chandelier Crystal"
              },
              {
                "value": "fairy-lights",
                "label": "Lampu Tumblr"
              },
              {
                "value": "string-lights",
                "label": "String Lights"
              },
              {
                "value": "lantern-gelak",
                "label": "Gelak/Lentera"
              },
              {
                "value": "led-spotlight",
                "label": "LED Spotlight"
              },
              {
                "value": "candle-ambient",
                "label": "Candle Ambient"
              }
            ]
          },
          {
            "id": "wedding-design-furniture-options",
            "label": "Kursi & Sofa Pelaminan",
            "type": "choice",
            "defaultValue": "sofa-pengantin-mewah",
            "required": false,
            "options": [
              {
                "value": "sofa-pengantin-mewah",
                "label": "Sofa Pengantin Mewah"
              },
              {
                "value": "kursi-pelaminan-jawa",
                "label": "Kursi Pelaminan Jawa"
              },
              {
                "value": "singgasana-gold",
                "label": "Singgasana Gold"
              },
              {
                "value": "throne-classic",
                "label": "Throne Classic"
              },
              {
                "value": "loveseat-modern",
                "label": "Loveseat Modern"
              },
              {
                "value": "bench-minimalis",
                "label": "Bench Minimalis"
              }
            ]
          },
          {
            "id": "wedding-design-pelaminan-options",
            "label": "Style Pelaminan",
            "type": "choice",
            "defaultValue": "pelaminan-gebyok",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "pelaminan-gebyok",
                "label": "Gebyok Jawa"
              },
              {
                "value": "pelaminan-konde",
                "label": "Konde Sunda"
              },
              {
                "value": "pelaminan-modern-minimalis",
                "label": "Modern Minimalis"
              },
              {
                "value": "pelaminan-floral-garden",
                "label": "Floral Garden"
              },
              {
                "value": "pelaminan-luxury-draping",
                "label": "Luxury Draping"
              },
              {
                "value": "pelaminan-arabian-style",
                "label": "Arabian Style"
              }
            ]
          },
          {
            "id": "wedding-design-color-options",
            "label": "Warna Tema",
            "type": "choice",
            "defaultValue": "gold-maroon",
            "required": false,
            "options": [
              {
                "value": "gold-maroon",
                "label": "Gold & Maroon"
              },
              {
                "value": "white-gold",
                "label": "White & Gold"
              },
              {
                "value": "pink-gold",
                "label": "Pink & Gold"
              },
              {
                "value": "emerald-gold",
                "label": "Emerald & Gold"
              },
              {
                "value": "navy-silver",
                "label": "Navy & Silver"
              },
              {
                "value": "burgundy-cream",
                "label": "Burgundy & Cream"
              }
            ]
          },
          {
            "id": "wedding-design-lighting-options",
            "label": "Pencahayaan",
            "type": "choice",
            "defaultValue": "warm-romantic",
            "required": false,
            "options": [
              {
                "value": "warm-romantic",
                "label": "Warm Romantic"
              },
              {
                "value": "bright-elegant",
                "label": "Bright Elegant"
              },
              {
                "value": "soft-dreamy",
                "label": "Soft Dreamy"
              },
              {
                "value": "dramatic-spotlight",
                "label": "Dramatic Spotlight"
              }
            ]
          },
          {
            "id": "wedding-design-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "16:9",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "9:16",
                "label": "9:16"
              },
              {
                "value": "4:3",
                "label": "4:3"
              },
              {
                "value": "4:5",
                "label": "4:5"
              }
            ]
          },
          {
            "id": "wedding-design-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          },
          {
            "id": "wedding-design-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Design the requested wedding visual using the supplied names, dates, palette and theme. Keep text accurate and legible.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "umrah-haji",
    "label": "Foto Umrah/Haji",
    "description": "Buat potret dengan suasana Umrah atau Haji.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "umrah-attire-options",
        "label": "Pilih Pakaian",
        "type": "choice",
        "defaultValue": "pakaian Ihram putih yang sesuai",
        "required": false,
        "options": [
          {
            "value": "pakaian Ihram putih yang sesuai",
            "label": "Pakaian Ihram"
          },
          {
            "value": "bebas-sopan",
            "label": "Bebas Sopan"
          }
        ]
      },
      {
        "id": "umrah-theme-options",
        "label": "Pilih Lokasi",
        "type": "choice",
        "defaultValue": "Gaya pemotretan modern & profesional...",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Gaya pemotretan modern & profesional...",
            "label": "Gaya Modern"
          },
          {
            "value": "Di Depan Ka'bah (Masjidil Haram)...",
            "label": "Depan Ka'bah"
          },
          {
            "value": "masjid-nabawi",
            "label": "Masjid Nabawi"
          },
          {
            "value": "jabal-khandamah",
            "label": "Jabal Khandamah"
          },
          {
            "value": "Tawaf di Ka'bah...",
            "label": "Tawaf"
          },
          {
            "value": "Berdoa di Raudhah...",
            "label": "Di Raudhah"
          },
          {
            "value": "Padang Arafah / Mina...",
            "label": "Arafah/Mina"
          },
          {
            "value": "Sunset di Makkah...",
            "label": "Sunset Makkah"
          }
        ]
      },
      {
        "id": "umrah-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "umrah-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "umrah-haji-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a respectful Umrah or Hajj-themed portrait preserving the person's uploaded identity and applying the selected attire and scene.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "graduation-photo",
    "label": "Foto Wisuda",
    "description": "Buat potret wisuda dengan toga, latar, dan gaya pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "graduation-background-input",
        "label": "Pilih Background Custom",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "graduation-medal-input",
        "label": "Pilih Foto Medal",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "graduation-certificate-input",
        "label": "Pilih Foto Ijazah",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "graduation-toga-style-options",
        "label": "Gaya Toga *",
        "type": "choice",
        "defaultValue": "Formal Indonesian",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Formal Indonesian",
            "label": "🎓 Formal Indonesia"
          },
          {
            "value": "Modern Indonesian",
            "label": "✨ Modern Indonesia"
          },
          {
            "value": "International Style",
            "label": "🌍 International"
          },
          {
            "value": "Classic Elegant",
            "label": "👔 Classic Elegant"
          }
        ]
      },
      {
        "id": "graduation-background-options",
        "label": "Background *",
        "type": "choice",
        "defaultValue": "University Campus",
        "required": false,
        "options": [
          {
            "value": "University Campus",
            "label": "🏛️ Kampus"
          },
          {
            "value": "Studio Professional",
            "label": "📸 Studio"
          },
          {
            "value": "Outdoor Garden",
            "label": "🌳 Taman"
          },
          {
            "value": "Library Academic",
            "label": "📚 Perpustakaan"
          },
          {
            "value": "Auditorium Hall",
            "label": "🎭 Auditorium"
          },
          {
            "value": "Modern Architecture",
            "label": "🏢 Modern"
          }
        ]
      },
      {
        "id": "graduation-pose-options",
        "label": "Pose & Expression",
        "type": "choice",
        "defaultValue": "Formal Portrait",
        "required": false,
        "options": [
          {
            "value": "Formal Portrait",
            "label": "📷 Formal"
          },
          {
            "value": "Happy Smile",
            "label": "😊 Happy Smile"
          },
          {
            "value": "Proud Confident",
            "label": "💪 Confident"
          },
          {
            "value": "Joyful Celebratory",
            "label": "🎉 Celebratory"
          }
        ]
      },
      {
        "id": "graduation-accessories-options",
        "label": "Aksesoris (Optional)",
        "type": "choice",
        "defaultValue": "Certificate",
        "required": false,
        "options": [
          {
            "value": "Medal",
            "label": "🏅 Medal"
          },
          {
            "value": "Bouquet",
            "label": "💐 Bouquet"
          },
          {
            "value": "Certificate",
            "label": "📜 Ijazah"
          },
          {
            "value": "Glasses",
            "label": "👓 Glasses"
          }
        ]
      },
      {
        "id": "graduation-aspect-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "2:3",
            "label": "2:3"
          }
        ]
      },
      {
        "id": "graduation-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "graduation-photo-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a graduation portrait preserving identity and using the selected gown, institution details and background. Do not invent institutional names.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "photo-booth",
    "label": "Photo Booth",
    "description": "Susun foto booth dalam frame dan tema pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "photo-booth-input",
        "label": "📸 Klik untuk upload foto Bisa upload 1-4 foto sekaligus",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "photo-booth-custom-theme-input",
        "label": "✨ Tema Kustom Anda:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Tropical Beach, Neon Cyberpunk, Flower Garden...",
        "role": "style"
      },
      {
        "id": "photo-booth-frame-options",
        "label": "Pilih Tema Frame",
        "type": "choice",
        "defaultValue": "Classic Strip",
        "required": false,
        "options": [
          {
            "value": "Classic Strip",
            "label": "Classic Strip"
          },
          {
            "value": "Foto Box",
            "label": "Foto Box"
          },
          {
            "value": "Vintage Polaroid",
            "label": "Polaroid"
          },
          {
            "value": "Colorful Party",
            "label": "Party"
          },
          {
            "value": "Wedding Elegant",
            "label": "Wedding"
          },
          {
            "value": "Birthday Fun",
            "label": "Birthday"
          },
          {
            "value": "Retro 80s",
            "label": "Retro 80s"
          },
          {
            "value": "Modern Minimal",
            "label": "Minimal"
          },
          {
            "value": "Neon Cyberpunk",
            "label": "Neon"
          },
          {
            "value": "Tropical Beach",
            "label": "Beach"
          },
          {
            "value": "Christmas Holiday",
            "label": "Christmas"
          },
          {
            "value": "Halloween Spooky",
            "label": "Halloween"
          },
          {
            "value": "Valentine Love",
            "label": "Valentine"
          },
          {
            "value": "Graduation",
            "label": "Graduation"
          },
          {
            "value": "Baby Shower",
            "label": "Baby"
          },
          {
            "value": "Festival Concert",
            "label": "Festival"
          },
          {
            "value": "Movie Cinema",
            "label": "Cinema"
          },
          {
            "value": "Travel Adventure",
            "label": "Travel"
          },
          {
            "value": "Anime Manga",
            "label": "Anime"
          },
          {
            "value": "Gaming Esports",
            "label": "Gaming"
          },
          {
            "value": "Sports Team",
            "label": "Sports"
          },
          {
            "value": "Korean Photobox",
            "label": "Korean Box"
          },
          {
            "value": "Custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "photo-booth-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "photo-booth-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "photo-booth-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a photo-booth composition preserving the uploaded people and using the selected poses, frame layout and theme.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "birthday-photo",
    "label": "Foto Ulang Tahun",
    "description": "Buat foto ulang tahun dengan dekorasi dan detail acara.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "birthday-photo-upload",
        "label": "Klik untuk upload Upload 1-5 foto orang (keluarga/teman) 0/5 foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "birthday-upload-now",
        "label": "Foto Sekarang Versi dewasa kamu",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "birthday-upload-childhood",
        "label": "Foto Masa Kecil Versi kecil kamu (usia bebas)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "birthday-custom-theme",
        "label": "Atau Tulis Tema Custom:",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: tema kartun Doraemon dengan dekorasi biru putih, nuansa Jepang...",
        "role": "prompt"
      },
      {
        "id": "birthday-mode-options",
        "label": "Pilih Mode",
        "type": "choice",
        "defaultValue": "pesta",
        "required": false,
        "options": [
          {
            "value": "pesta",
            "label": "Pesta Biasa 1-5 foto, 20+ tema pesta"
          },
          {
            "value": "kenangan",
            "label": "Kenangan Past vs Present, cinematic"
          }
        ]
      },
      {
        "id": "birthday-age-options",
        "label": "Kategori Umur",
        "type": "choice",
        "defaultValue": "child",
        "required": false,
        "options": [
          {
            "value": "baby",
            "label": "Bayi (0-2)"
          },
          {
            "value": "toddler",
            "label": "Balita (3-5)"
          },
          {
            "value": "child",
            "label": "Anak (6-12)"
          },
          {
            "value": "teen",
            "label": "Remaja (13-17)"
          },
          {
            "value": "adult",
            "label": "Dewasa (18-59)"
          },
          {
            "value": "senior",
            "label": "Lansia (60+)"
          }
        ]
      },
      {
        "id": "birthday-theme-options",
        "label": "Tema Ulang Tahun",
        "type": "choice",
        "defaultValue": "memory-projection",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "rainbow-party",
            "label": "Rainbow Party"
          },
          {
            "value": "unicorn-magic",
            "label": "Unicorn Magic"
          },
          {
            "value": "princess-castle",
            "label": "Princess Castle"
          },
          {
            "value": "superhero",
            "label": "Superhero"
          },
          {
            "value": "dinosaur",
            "label": "Dinosaur"
          },
          {
            "value": "mermaid",
            "label": "Mermaid"
          },
          {
            "value": "space-astronaut",
            "label": "Space Astronaut"
          },
          {
            "value": "safari-jungle",
            "label": "Safari Jungle"
          },
          {
            "value": "garden-flower",
            "label": "Garden Flower"
          },
          {
            "value": "pirate",
            "label": "Pirate"
          },
          {
            "value": "circus",
            "label": "Circus"
          },
          {
            "value": "candy-land",
            "label": "Candy Land"
          },
          {
            "value": "elegant-gold",
            "label": "Elegant Gold"
          },
          {
            "value": "vintage-retro",
            "label": "Vintage Retro"
          },
          {
            "value": "hollywood-glam",
            "label": "Hollywood Glam"
          },
          {
            "value": "garden-tea-party",
            "label": "Tea Party"
          },
          {
            "value": "beach-tropical",
            "label": "Beach Tropical"
          },
          {
            "value": "winter-wonderland",
            "label": "Winter Wonderland"
          },
          {
            "value": "minimalist-modern",
            "label": "Minimalist Modern"
          },
          {
            "value": "boho-chic",
            "label": "Boho Chic"
          },
          {
            "value": "memory-projection",
            "label": "Memory Projection"
          },
          {
            "value": "holding-childhood-photo",
            "label": "Pegang Foto Masa Kecil"
          },
          {
            "value": "mirror-reflection",
            "label": "Mirror Reflection"
          },
          {
            "value": "then-and-now-split",
            "label": "Then & Now Split"
          },
          {
            "value": "time-portal-ghost",
            "label": "Time Portal"
          },
          {
            "value": "cake-photo-topper",
            "label": "Cake Photo Topper"
          }
        ]
      },
      {
        "id": "birthday-decoration-options",
        "label": "Gaya Dekorasi",
        "type": "choice",
        "defaultValue": "balloon-arch",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "balloon-arch",
            "label": "Balloon Arch"
          },
          {
            "value": "confetti-explosion",
            "label": "Confetti"
          },
          {
            "value": "banner-garland",
            "label": "Banner & Garland"
          },
          {
            "value": "giant-numbers",
            "label": "Giant Numbers"
          },
          {
            "value": "flower-arrangement",
            "label": "Flower Arrangement"
          },
          {
            "value": "photo-backdrop",
            "label": "Photo Backdrop"
          }
        ]
      },
      {
        "id": "birthday-cake-options",
        "label": "Style Kue Ulang Tahun",
        "type": "choice",
        "defaultValue": "tiered-cake",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "tiered-cake",
            "label": "Tiered Cake"
          },
          {
            "value": "character-cake",
            "label": "Character Cake"
          },
          {
            "value": "drip-cake",
            "label": "Drip Cake"
          },
          {
            "value": "cupcake-tower",
            "label": "Cupcake Tower"
          },
          {
            "value": "elegant-fondant",
            "label": "Elegant Fondant"
          },
          {
            "value": "rustic-naked",
            "label": "Rustic Naked"
          }
        ]
      },
      {
        "id": "birthday-mood-options",
        "label": "Mood / Atmosfer",
        "type": "choice",
        "defaultValue": "nostalgic",
        "required": false,
        "options": [
          {
            "value": "nostalgic",
            "label": "Nostalgic"
          },
          {
            "value": "emotional",
            "label": "Emotional"
          },
          {
            "value": "joyful",
            "label": "Joyful"
          },
          {
            "value": "dramatic",
            "label": "Dramatic"
          }
        ]
      },
      {
        "id": "birthday-lighting-options",
        "label": "Pencahayaan",
        "type": "choice",
        "defaultValue": "bright-cheerful",
        "required": false,
        "options": [
          {
            "value": "bright-cheerful",
            "label": "Bright Cheerful"
          },
          {
            "value": "soft-dreamy",
            "label": "Soft Dreamy"
          },
          {
            "value": "party-lights",
            "label": "Party Lights"
          },
          {
            "value": "candle-glow",
            "label": "Candle Glow"
          }
        ]
      },
      {
        "id": "birthday-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "4:3",
            "label": "4:3"
          },
          {
            "value": "4:5",
            "label": "4:5"
          }
        ]
      },
      {
        "id": "birthday-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a birthday portrait using the supplied identity, age, decorations and theme. Reproduce any requested text accurately.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "kartu-lebaran",
    "label": "Kartu Lebaran",
    "description": "Susun kartu ucapan Lebaran dengan foto dan pesan pribadi.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "lebaran-photo-upload",
        "label": "Upload Foto Keluarga (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "lebaran-family-name",
        "label": "Nama Keluarga (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "contoh: Keluarga Bapak Ahmad"
      },
      {
        "id": "lebaran-custom-greeting",
        "label": "Ucapan Lebaran",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Atau ketik ucapan sendiri..."
      },
      {
        "id": "lebaran-theme-options",
        "label": "Tema Kartu (20 tema)",
        "type": "choice",
        "defaultValue": "ornamen-klasik",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "ornamen-klasik",
            "label": "Ornamen Klasik"
          },
          {
            "value": "modern-minimalis",
            "label": "Modern Minimalis"
          },
          {
            "value": "ketupat-lentera",
            "label": "Ketupat & Lentera"
          },
          {
            "value": "masjid-nabawi",
            "label": "Masjid Nabawi"
          },
          {
            "value": "masjid-istiqlal",
            "label": "Masjid Istiqlal"
          },
          {
            "value": "bunga-tropis",
            "label": "Bunga Tropis"
          },
          {
            "value": "batik-nusantara",
            "label": "Batik Nusantara"
          },
          {
            "value": "watercolor-floral",
            "label": "Watercolor Floral"
          },
          {
            "value": "gold-luxury",
            "label": "Gold Luxury"
          },
          {
            "value": "bintang-bulan",
            "label": "Bintang & Bulan"
          },
          {
            "value": "kampung-halaman",
            "label": "Kampung Halaman"
          },
          {
            "value": "alam-hijau",
            "label": "Alam Hijau"
          },
          {
            "value": "langit-senja",
            "label": "Langit Senja"
          },
          {
            "value": "warisan-jawa",
            "label": "Warisan Jawa"
          },
          {
            "value": "melayu-tradisional",
            "label": "Melayu Tradisional"
          },
          {
            "value": "nuansa-biru-tosca",
            "label": "Biru Tosca"
          },
          {
            "value": "nuansa-ungu",
            "label": "Nuansa Ungu"
          },
          {
            "value": "rose-gold",
            "label": "Rose Gold"
          },
          {
            "value": "kaligrafi-arab",
            "label": "Kaligrafi Arab"
          },
          {
            "value": "fanoos-lentera",
            "label": "Fanoos & Lentera"
          }
        ]
      },
      {
        "id": "lebaran-greeting-options",
        "label": "Ucapan Lebaran",
        "type": "choice",
        "defaultValue": "minal-aidin",
        "required": false,
        "options": [
          {
            "value": "minal-aidin",
            "label": "Minal Aidin Wal Faizin"
          },
          {
            "value": "taqabbalallahu",
            "label": "Taqabbalallahu Minna Wa Minkum"
          },
          {
            "value": "selamat-idul-fitri",
            "label": "Selamat Idul Fitri 1447 H"
          },
          {
            "value": "eid-mubarak",
            "label": "Eid Mubarak 1447 H"
          }
        ]
      },
      {
        "id": "lebaran-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 WA"
          },
          {
            "value": "3:4",
            "label": "3:4 Story"
          },
          {
            "value": "9:16",
            "label": "9:16 Reels"
          }
        ]
      },
      {
        "id": "lebaran-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "kartu-lebaran-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Design an Eid greeting card using the uploaded people, supplied greeting text, palette and chosen theme.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "worldcup",
    "label": "Foto World Cup",
    "description": "Buat foto bertema sepak bola dengan tim dan latar pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "wc-faces-upload",
        "label": "Klik untuk upload (max 5 foto) Foto wajah orang yang mau dimasukkan ke scene 0/5 foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "wc-country",
        "label": "Negara / Tim",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Indonesia, Argentina, Brazil"
      },
      {
        "id": "wc-custom-theme",
        "label": "Tema Scene",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: parade juara keliling kota, foto bareng maskot, dll",
        "role": "style"
      },
      {
        "id": "wc-custom-prompt",
        "label": "Custom Prompt (opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis arahan tambahan untuk AI...",
        "role": "prompt"
      },
      {
        "id": "wc-themes-grid",
        "label": "Tema Scene",
        "type": "choice",
        "defaultValue": "stadium-supporter",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "stadium-supporter",
            "label": "Suporter di Stadion"
          },
          {
            "value": "on-pitch-player",
            "label": "Jadi Pemain di Lapangan"
          },
          {
            "value": "lift-trophy",
            "label": "Angkat Trophy Juara"
          },
          {
            "value": "jersey-portrait",
            "label": "Jersey Portrait Studio"
          },
          {
            "value": "goal-celebration",
            "label": "Selebrasi Gol"
          },
          {
            "value": "fan-zone",
            "label": "Nobar Fan Zone"
          },
          {
            "value": "player-tunnel",
            "label": "Player Tunnel / Walk-out"
          },
          {
            "value": "team-squad",
            "label": "Foto Tim Resmi"
          },
          {
            "value": "press-conference",
            "label": "Press Conference"
          },
          {
            "value": "trading-card",
            "label": "Kartu Pemain"
          },
          {
            "value": "custom",
            "label": "Custom (Suasana Sendiri)"
          }
        ]
      },
      {
        "id": "wc-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:3",
            "label": "4:3"
          }
        ]
      },
      {
        "id": "wc-count-options",
        "label": "Jumlah hasil",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a football-themed portrait using the supplied identity, chosen team colors, outfit and scene. Preserve the user's face.",
    "isNew": true,
    "hidden": false
  },
  {
    "id": "watch-together",
    "label": "Nonton Bareng",
    "description": "Buat adegan nonton bersama sesuai tim dan suasana pilihan.",
    "iconId": "users",
    "group": "family-lifestyle",
    "kind": "image",
    "fields": [
      {
        "id": "wt-faces-upload",
        "label": "Klik untuk upload (max 5 foto) Foto orang yang nonton bareng 0/5 foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "wt-jersey-upload",
        "label": "Klik untuk upload jersey (opsional) Foto kaos team (preserve design, sponsor, nomor)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "wt-logo-upload",
        "label": "Klik untuk upload logo team (opsional) Logo tim sendiri — dipakai di broadcast overlay / flags",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "wt-team-self",
        "label": "Tim Sendiri",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Persib Bandung"
      },
      {
        "id": "wt-team-opponent",
        "label": "Tim Lawan",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Persija"
      },
      {
        "id": "wt-custom-prompt",
        "label": "Custom Prompt (opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis arahan tambahan untuk AI...",
        "role": "prompt"
      },
      {
        "id": "wt-themes-grid",
        "label": "Tema Scene",
        "type": "choice",
        "defaultValue": "tv-broadcast",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "tv-broadcast",
            "label": "Kena Kamera TV"
          },
          {
            "value": "cafe-resto",
            "label": "Cafe / Warung"
          },
          {
            "value": "living-room",
            "label": "Ruang Tamu"
          },
          {
            "value": "stadion",
            "label": "Stadion"
          },
          {
            "value": "watch-party-outdoor",
            "label": "Watch Party Outdoor"
          },
          {
            "value": "sport-bar-pub",
            "label": "Sport Bar / Pub"
          },
          {
            "value": "candid",
            "label": "Candid (Kedapatan Difoto)"
          }
        ]
      },
      {
        "id": "wt-mood-options",
        "label": "Mood",
        "type": "choice",
        "defaultValue": "excited",
        "required": false,
        "options": [
          {
            "value": "excited",
            "label": "Excited"
          },
          {
            "value": "tense",
            "label": "Tegang"
          },
          {
            "value": "celebrating",
            "label": "Selebrasi"
          },
          {
            "value": "relaxed",
            "label": "Santai"
          }
        ]
      },
      {
        "id": "wt-angle-options",
        "label": "Camera Angle",
        "type": "choice",
        "defaultValue": "wide",
        "required": false,
        "options": [
          {
            "value": "wide",
            "label": "Wide"
          },
          {
            "value": "medium",
            "label": "Medium"
          },
          {
            "value": "close-up",
            "label": "Close-up"
          },
          {
            "value": "low-angle",
            "label": "Low Angle"
          },
          {
            "value": "high-angle",
            "label": "High Angle"
          },
          {
            "value": "over-shoulder",
            "label": "Over Shoulder"
          }
        ]
      },
      {
        "id": "wt-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:3",
            "label": "4:3"
          }
        ]
      },
      {
        "id": "wt-count-options",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a natural watch-party photograph using the uploaded people and selected match atmosphere, team colors and setting.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "professional-headshot",
    "label": "Professional Headshot",
    "description": "Buat headshot profesional dengan pakaian dan latar pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "headshot-input",
        "label": "👔 Klik atau seret foto Anda PNG, JPG, HEIC (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "headshot-custom-theme-input",
        "label": "✨ Tema/Profesi Kustom:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Financial Advisor, Real Estate Agent, Designer...",
        "role": "style"
      },
      {
        "id": "headshot-theme-options",
        "label": "Pilih Tema Profesional",
        "type": "choice",
        "defaultValue": "LinkedIn Professional",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "LinkedIn Professional",
            "label": "LinkedIn Pro"
          },
          {
            "value": "Business Executive",
            "label": "Executive"
          },
          {
            "value": "Corporate Formal",
            "label": "Corporate"
          },
          {
            "value": "Creative Professional",
            "label": "Creative"
          },
          {
            "value": "Tech Professional",
            "label": "Tech"
          },
          {
            "value": "Medical Professional",
            "label": "Medical"
          },
          {
            "value": "Legal Professional",
            "label": "Legal"
          },
          {
            "value": "Entrepreneur",
            "label": "Entrepreneur"
          },
          {
            "value": "Academic",
            "label": "Academic"
          },
          {
            "value": "Smart Casual",
            "label": "Smart Casual"
          },
          {
            "value": "Consultant",
            "label": "Consultant"
          },
          {
            "value": "Custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "headshot-bg-options",
        "label": "Background",
        "type": "choice",
        "defaultValue": "Studio White",
        "required": false,
        "options": [
          {
            "value": "Studio White",
            "label": "⚪ White"
          },
          {
            "value": "Professional Gray",
            "label": "⚫ Gray"
          },
          {
            "value": "Navy Blue",
            "label": "🔵 Navy"
          },
          {
            "value": "Gradient Blue",
            "label": "💙 Gradient"
          },
          {
            "value": "Office Interior",
            "label": "🏢 Office"
          },
          {
            "value": "Outdoor Professional",
            "label": "🌳 Outdoor"
          }
        ]
      },
      {
        "id": "headshot-attire-options",
        "label": "Pakaian",
        "type": "choice",
        "defaultValue": "Business Suit",
        "required": false,
        "options": [
          {
            "value": "Business Suit",
            "label": "👔 Suit"
          },
          {
            "value": "Smart Casual Blazer",
            "label": "🧥 Blazer"
          },
          {
            "value": "Professional Shirt",
            "label": "👕 Shirt"
          },
          {
            "value": "Industry Specific",
            "label": "🏥 Industry"
          }
        ]
      },
      {
        "id": "headshot-style-options",
        "label": "Gaya Foto",
        "type": "choice",
        "defaultValue": "Classic",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Classic",
            "label": "Klasik"
          },
          {
            "value": "Modern",
            "label": "Modern"
          },
          {
            "value": "Cinematic",
            "label": "Sinematik"
          }
        ]
      },
      {
        "id": "headshot-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "headshot-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "professional-headshot-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a professional headshot preserving identity, natural skin texture and the selected clothing, background and framing.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "studio-profil",
    "label": "Studio Profil",
    "description": "Buat foto profil dengan preset studio dan karakter visual.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "studio-profil-image-input",
        "label": "Klik untuk upload foto Foto orang/karakter — wajah dan ekspresi terlihat jelas",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "studio-profil-screenshot-input",
        "label": "Klik upload screenshot profil AI akan render tepat seperti layout profilmu (followers, posts, dll)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "studio-profil-character-name-input",
        "label": "Nama Karakter / Username",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: AIMODE"
      },
      {
        "id": "studio-profil-bio-input",
        "label": "Bio Singkat (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Content Creator | AI Enthusiast"
      },
      {
        "id": "studio-profil-followers-input",
        "label": "Jumlah Followers (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: 1.2M atau 350K"
      },
      {
        "id": "studio-profil-template-options",
        "label": "Pilih Template Scene",
        "type": "choice",
        "defaultValue": "torn-paper-breakout",
        "required": false,
        "options": [
          {
            "value": "torn-paper-breakout",
            "label": "Tembus Kertas Sobek"
          },
          {
            "value": "phone-screen-popout",
            "label": "Keluar Layar HP Coming Soon"
          },
          {
            "value": "cover-hero-portrait",
            "label": "Cover Hero Portrait Coming Soon"
          }
        ]
      },
      {
        "id": "studio-profil-platform-options",
        "label": "Pilih Platform Sosmed",
        "type": "choice",
        "defaultValue": "instagram",
        "required": false,
        "options": [
          {
            "value": "instagram",
            "label": "Instagram"
          },
          {
            "value": "tiktok",
            "label": "TikTok"
          },
          {
            "value": "youtube",
            "label": "YouTube"
          },
          {
            "value": "twitter",
            "label": "X / Twitter"
          },
          {
            "value": "facebook",
            "label": "Facebook"
          }
        ]
      },
      {
        "id": "studio-profil-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "9:16",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "4:5",
            "label": "4:5"
          }
        ]
      },
      {
        "id": "studio-profil-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "studio-profil-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a polished studio profile portrait preserving the uploaded identity and applying the selected visual theme, outfit and background.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "studio-aesthetic",
    "label": "Studio Aesthetic",
    "description": "Buat potret aesthetic dengan suasana studio pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "studio-aesthetic-image-input",
        "label": "Klik untuk upload foto Foto orang/karakter — wajah dan ekspresi terlihat jelas",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "studio-aesthetic-custom-input",
        "label": "Tambahan Style (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: warna tema biru pastel, tambahkan teks 'good vibes', tema bunga sakura",
        "role": "prompt"
      },
      {
        "id": "studio-aesthetic-template-options",
        "label": "Pilih Template Aesthetic",
        "type": "choice",
        "defaultValue": "korean-chibi-sticker",
        "required": false,
        "options": [
          {
            "value": "korean-chibi-sticker",
            "label": "Korean Chibi Sticker"
          },
          {
            "value": "y2k-sticker-pack",
            "label": "Y2K Sticker Pack Coming Soon"
          },
          {
            "value": "pastel-dream",
            "label": "Pastel Dream Coming Soon"
          }
        ]
      },
      {
        "id": "studio-aesthetic-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "studio-aesthetic-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create an aesthetic portrait based on the supplied identity and chosen studio mood, colors, pose and lighting.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "fotogenic",
    "label": "Fotogenic",
    "description": "Terapkan efek fotografi dengan intensitas dan variasi pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "fotogenic-upload-input",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "fotogenic-custom-input",
        "label": "Deskripsi Efek Custom:",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Foto seperti sunset pantai Bali dengan tone golden orange dramatis...",
        "role": "prompt"
      },
      {
        "id": "fotogenic-cat-options",
        "label": "Kategori Efek",
        "type": "choice",
        "defaultValue": "Film & Vintage",
        "required": false,
        "options": [
          {
            "value": "Film & Vintage",
            "label": "Film"
          },
          {
            "value": "Cinematic & Moody",
            "label": "Cinematic"
          },
          {
            "value": "Pop & Neon",
            "label": "Neon"
          },
          {
            "value": "Natural & Warm",
            "label": "Natural"
          },
          {
            "value": "Aesthetic & Soft",
            "label": "Aesthetic"
          },
          {
            "value": "Fashion & Editorial",
            "label": "Fashion"
          },
          {
            "value": "Retro & Classic",
            "label": "Retro"
          }
        ]
      },
      {
        "id": "fotogenic-intensity-options",
        "label": "Intensitas Efek",
        "type": "choice",
        "defaultValue": "sedang",
        "required": false,
        "options": [
          {
            "value": "ringan",
            "label": "Ringan"
          },
          {
            "value": "sedang",
            "label": "Sedang"
          },
          {
            "value": "kuat",
            "label": "Kuat"
          }
        ]
      },
      {
        "id": "fotogenic-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "fotogenic-count-options",
        "label": "Jumlah Variasi",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "2",
            "label": "2 Foto"
          },
          {
            "value": "4",
            "label": "4 Foto"
          },
          {
            "value": "6",
            "label": "6 Foto"
          }
        ]
      },
      {
        "id": "photo-effect",
        "label": "Efek foto",
        "type": "choice",
        "options": [
          {
            "value": "film-grain",
            "label": "Film Grain"
          },
          {
            "value": "polaroid",
            "label": "Polaroid"
          },
          {
            "value": "kodachrome",
            "label": "Kodachrome"
          },
          {
            "value": "cross-process",
            "label": "Cross Process"
          },
          {
            "value": "lomography",
            "label": "Lomography"
          },
          {
            "value": "vhs-tape",
            "label": "VHS Tape"
          },
          {
            "value": "faded-film",
            "label": "Faded Film"
          },
          {
            "value": "tungsten-shift",
            "label": "Tungsten Shift"
          },
          {
            "value": "hollywood",
            "label": "Hollywood"
          },
          {
            "value": "noir",
            "label": "Noir"
          },
          {
            "value": "dark-cinema",
            "label": "Dark Cinema"
          },
          {
            "value": "blade-runner",
            "label": "Blade Runner"
          },
          {
            "value": "wes-anderson",
            "label": "Wes Anderson"
          },
          {
            "value": "blue-hour",
            "label": "Blue Hour"
          },
          {
            "value": "smoke-haze",
            "label": "Smoke & Haze"
          },
          {
            "value": "moonlight",
            "label": "Moonlight"
          },
          {
            "value": "cyberpunk",
            "label": "Cyberpunk"
          },
          {
            "value": "neon-tokyo",
            "label": "Neon Tokyo"
          },
          {
            "value": "y2k-glam",
            "label": "Y2K Glam"
          },
          {
            "value": "glitch-art",
            "label": "Glitch Art"
          },
          {
            "value": "holographic",
            "label": "Holographic"
          },
          {
            "value": "electric",
            "label": "Electric"
          },
          {
            "value": "uv-night",
            "label": "UV Night"
          },
          {
            "value": "synthwave",
            "label": "Synthwave"
          },
          {
            "value": "golden-hour",
            "label": "Golden Hour"
          },
          {
            "value": "forest-bath",
            "label": "Forest Bath"
          },
          {
            "value": "beach-summer",
            "label": "Beach Summer"
          },
          {
            "value": "sunrise-glow",
            "label": "Sunrise Glow"
          },
          {
            "value": "desert-warm",
            "label": "Desert Warm"
          },
          {
            "value": "autumn-leaves",
            "label": "Autumn Leaves"
          },
          {
            "value": "misty-morning",
            "label": "Misty Morning"
          },
          {
            "value": "tropical-vibrant",
            "label": "Tropical Vibrant"
          },
          {
            "value": "pastel-dream",
            "label": "Pastel Dream"
          },
          {
            "value": "vsco-aesthetic",
            "label": "VSCO Aesthetic"
          },
          {
            "value": "minimalist-white",
            "label": "Minimalist White"
          },
          {
            "value": "rose-garden",
            "label": "Rose Garden"
          },
          {
            "value": "cloud-soft",
            "label": "Cloud Soft"
          },
          {
            "value": "cherry-blossom",
            "label": "Cherry Blossom"
          },
          {
            "value": "cottagecore",
            "label": "Cottagecore"
          },
          {
            "value": "dreamy-blur",
            "label": "Dreamy Blur"
          },
          {
            "value": "magazine-cover",
            "label": "Magazine Cover"
          },
          {
            "value": "runway-show",
            "label": "Runway Show"
          },
          {
            "value": "vogue-black",
            "label": "Vogue Black"
          },
          {
            "value": "luxury-gold",
            "label": "Luxury Gold"
          },
          {
            "value": "street-style",
            "label": "Street Style"
          },
          {
            "value": "beauty-vlog",
            "label": "Beauty Vlog"
          },
          {
            "value": "campaign-shot",
            "label": "Campaign Shot"
          },
          {
            "value": "bold-editorial",
            "label": "Bold Editorial"
          },
          {
            "value": "70s-kodacolor",
            "label": "70s Kodacolor"
          },
          {
            "value": "80s-neon",
            "label": "80s Neon"
          },
          {
            "value": "90s-grunge",
            "label": "90s Grunge"
          },
          {
            "value": "faded-90s",
            "label": "Faded 90s"
          },
          {
            "value": "disco-fever",
            "label": "Disco Fever"
          },
          {
            "value": "classic-b-w",
            "label": "Classic B&W"
          },
          {
            "value": "sepia-vintage",
            "label": "Sepia Vintage"
          },
          {
            "value": "old-hollywood",
            "label": "Old Hollywood"
          }
        ],
        "defaultValue": "film-grain",
        "required": false,
        "role": "style"
      }
    ],
    "promptIntent": "Apply the selected photographic effect to the uploaded image at the chosen intensity. Preserve the main subject and facial identity.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "hair-generator",
    "label": "Hair Generator",
    "description": "Coba gaya dan warna rambut pada foto referensi.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "hair-image-input",
        "label": "Foto referensi",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "hair-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "hair-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "hair-gender",
        "label": "Jenis kelamin",
        "type": "choice",
        "options": [
          {
            "value": "wanita",
            "label": "Wanita"
          },
          {
            "value": "pria",
            "label": "Pria"
          }
        ],
        "defaultValue": "wanita",
        "required": false
      },
      {
        "id": "hair-style-select",
        "label": "Gaya rambut",
        "type": "choice",
        "options": [
          {
            "value": "pixie-cut",
            "label": "Pixie cut"
          },
          {
            "value": "bob-cut",
            "label": "Bob cut"
          },
          {
            "value": "lob-long-bob",
            "label": "Lob (long bob)"
          },
          {
            "value": "shag-haircut",
            "label": "Shag haircut"
          },
          {
            "value": "rambut-panjang-lurus",
            "label": "Rambut panjang lurus"
          },
          {
            "value": "rambut-panjang-bergelombang",
            "label": "Rambut panjang bergelombang"
          },
          {
            "value": "rambut-ikal-curly",
            "label": "Rambut ikal (curly)"
          },
          {
            "value": "rambut-keriting-kinky",
            "label": "Rambut keriting (kinky)"
          },
          {
            "value": "poni-bangs",
            "label": "Poni (Bangs)"
          },
          {
            "value": "poni-samping-side-swept-bangs",
            "label": "Poni samping (Side-swept bangs)"
          },
          {
            "value": "sanggul-bun",
            "label": "Sanggul (Bun)"
          },
          {
            "value": "kuncir-kuda-ponytail",
            "label": "Kuncir kuda (Ponytail)"
          },
          {
            "value": "kepang-braids",
            "label": "Kepang (Braids)"
          },
          {
            "value": "gaya-asimetris",
            "label": "Gaya Asimetris"
          },
          {
            "value": "undercut-wanita",
            "label": "Undercut wanita"
          },
          {
            "value": "mullet-wanita",
            "label": "Mullet wanita"
          },
          {
            "value": "layered-haircut",
            "label": "Layered haircut"
          },
          {
            "value": "gaya-rambut-pernikahan",
            "label": "Gaya rambut pernikahan"
          },
          {
            "value": "gaya-rambut-formal",
            "label": "Gaya rambut formal"
          },
          {
            "value": "rambut-super-pendek",
            "label": "Rambut super pendek"
          },
          {
            "value": "crew-cut",
            "label": "Crew cut"
          },
          {
            "value": "buzz-cut",
            "label": "Buzz cut"
          },
          {
            "value": "undercut",
            "label": "Undercut"
          },
          {
            "value": "fade-high-fade",
            "label": "Fade (high fade)"
          },
          {
            "value": "fade-low-fade",
            "label": "Fade (low fade)"
          },
          {
            "value": "pompadour",
            "label": "Pompadour"
          },
          {
            "value": "quiff",
            "label": "Quiff"
          },
          {
            "value": "slick-back",
            "label": "Slick back"
          },
          {
            "value": "man-bun",
            "label": "Man bun"
          },
          {
            "value": "comma-hair-gaya-korea",
            "label": "Comma hair (gaya Korea)"
          },
          {
            "value": "two-block-haircut",
            "label": "Two block haircut"
          },
          {
            "value": "mullet-pria",
            "label": "Mullet pria"
          },
          {
            "value": "rambut-gondrong-panjang",
            "label": "Rambut gondrong (panjang)"
          },
          {
            "value": "rambut-ikal-pria",
            "label": "Rambut ikal pria"
          },
          {
            "value": "caesar-cut",
            "label": "Caesar cut"
          },
          {
            "value": "french-crop",
            "label": "French crop"
          },
          {
            "value": "side-part",
            "label": "Side part"
          },
          {
            "value": "spiky-hair",
            "label": "Spiky hair"
          },
          {
            "value": "rambut-sedang-berantakan",
            "label": "Rambut sedang berantakan"
          }
        ],
        "defaultValue": "pixie-cut",
        "required": false,
        "role": "style"
      },
      {
        "id": "hair-color-select",
        "label": "Warna rambut",
        "type": "choice",
        "options": [
          {
            "value": "hitam-alami",
            "label": "Hitam alami"
          },
          {
            "value": "cokelat-tua",
            "label": "Cokelat tua"
          },
          {
            "value": "cokelat-muda",
            "label": "Cokelat muda"
          },
          {
            "value": "cokelat-karamel",
            "label": "Cokelat karamel"
          },
          {
            "value": "merah-burgundy",
            "label": "Merah burgundy"
          },
          {
            "value": "merah-tembaga",
            "label": "Merah tembaga"
          },
          {
            "value": "pirang-platinum",
            "label": "Pirang platinum"
          },
          {
            "value": "pirang-ash-blonde",
            "label": "Pirang ash blonde"
          },
          {
            "value": "pirang-madu",
            "label": "Pirang madu"
          },
          {
            "value": "rose-gold",
            "label": "Rose gold"
          },
          {
            "value": "biru-tua",
            "label": "Biru tua"
          },
          {
            "value": "biru-muda",
            "label": "Biru muda"
          },
          {
            "value": "ungu-lavender",
            "label": "Ungu lavender"
          },
          {
            "value": "ungu-tua",
            "label": "Ungu tua"
          },
          {
            "value": "hijau-emerald",
            "label": "Hijau emerald"
          },
          {
            "value": "pink-pastel",
            "label": "Pink pastel"
          },
          {
            "value": "abu-abu-granny-hair",
            "label": "Abu-abu (Granny hair)"
          },
          {
            "value": "ombre-gelap-ke-terang",
            "label": "Ombre (gelap ke terang)"
          },
          {
            "value": "balayage",
            "label": "Balayage"
          },
          {
            "value": "highlight-pirang",
            "label": "Highlight pirang"
          },
          {
            "value": "abu-abu",
            "label": "Abu-abu"
          },
          {
            "value": "salt-and-pepper",
            "label": "Salt and pepper"
          },
          {
            "value": "hijau-tua",
            "label": "Hijau tua"
          },
          {
            "value": "highlight-tipis",
            "label": "Highlight tipis"
          },
          {
            "value": "cokelat-kemerahan",
            "label": "Cokelat kemerahan"
          },
          {
            "value": "pria-pirang",
            "label": "Pria pirang"
          },
          {
            "value": "ungu-gelap",
            "label": "Ungu gelap"
          },
          {
            "value": "silver",
            "label": "Silver"
          },
          {
            "value": "putih",
            "label": "Putih"
          },
          {
            "value": "cokelat-espresso",
            "label": "Cokelat espresso"
          },
          {
            "value": "pirang-gelap",
            "label": "Pirang gelap"
          },
          {
            "value": "merah-jahe",
            "label": "Merah jahe"
          },
          {
            "value": "warna-natural",
            "label": "Warna natural"
          }
        ],
        "defaultValue": "hitam-alami",
        "required": false
      },
      {
        "id": "hair-generator-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Change the hairstyle and hair color as requested while preserving facial identity and the rest of the photograph.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "expression-changer",
    "label": "Expression Changer",
    "description": "Ubah ekspresi wajah dengan tetap menjaga identitas.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "expression-input",
        "label": "😊 Klik atau seret foto close-up wajah PNG, JPG, HEIC (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "expression-custom-input",
        "label": "✨ Ekspresi Kustom Anda:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: senyum malu-malu, wajah misterius, ekspresi memikat..."
      },
      {
        "id": "expression-type-options",
        "label": "Pilih Ekspresi Target",
        "type": "choice",
        "defaultValue": "Happy Smiling",
        "required": false,
        "options": [
          {
            "value": "Happy Smiling",
            "label": "Senyum Lebar"
          },
          {
            "value": "Gentle Smile",
            "label": "Senyum Lembut"
          },
          {
            "value": "Serious",
            "label": "Serius"
          },
          {
            "value": "Surprised",
            "label": "Terkejut"
          },
          {
            "value": "Sad",
            "label": "Sedih"
          },
          {
            "value": "Angry",
            "label": "Marah"
          },
          {
            "value": "Laughing",
            "label": "Tertawa"
          },
          {
            "value": "Confident",
            "label": "Percaya Diri"
          },
          {
            "value": "Thinking",
            "label": "Berpikir"
          },
          {
            "value": "Excited",
            "label": "Bersemangat"
          },
          {
            "value": "Neutral Calm",
            "label": "Netral Tenang"
          },
          {
            "value": "Custom",
            "label": "Kustom"
          }
        ]
      },
      {
        "id": "expression-intensity-options",
        "label": "Intensitas Ekspresi",
        "type": "choice",
        "defaultValue": "Moderate",
        "required": false,
        "options": [
          {
            "value": "Subtle",
            "label": "Halus"
          },
          {
            "value": "Moderate",
            "label": "Sedang"
          },
          {
            "value": "Strong",
            "label": "Kuat"
          }
        ]
      },
      {
        "id": "expression-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "expression-changer-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "expression-changer-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Apply the chosen facial expression to the supplied portrait while preserving identity, hairstyle and composition.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "miniature",
    "label": "Miniature Me",
    "description": "Buat versi mini dari orang pada referensi foto.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "miniature-person-file-input",
        "label": "Unggah Fotomu (Wajib)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "miniature-manual-prompt",
        "label": "Tulis Prompt Manual (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: cute chibi style, ultra realistic, 8k",
        "role": "prompt"
      },
      {
        "id": "miniature-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "miniature-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Create a playful miniature depiction of the uploaded person in the chosen scene while preserving their recognizable features.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "karikatur",
    "label": "Karikatur Generator",
    "description": "Ubah foto menjadi karikatur dengan gaya dan komposisi pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "karikatur-image-input",
        "label": "Klik atau seret foto di sini PNG, JPG, WEBP, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "karikatur-custom-style",
        "label": "Style Karikatur",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Masukkan style custom, contoh: disney style, ghibli style",
        "role": "style"
      },
      {
        "id": "karikatur-background-detail",
        "label": "Background",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Deskripsikan background yang diinginkan"
      },
      {
        "id": "karikatur-style-options",
        "label": "Style Karikatur",
        "type": "choice",
        "defaultValue": "anime",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "anime",
            "label": "Anime/Manga"
          },
          {
            "value": "cartoon",
            "label": "Cartoon Western"
          },
          {
            "value": "pixar",
            "label": "Pixar 3D"
          },
          {
            "value": "disney",
            "label": "Disney Style"
          },
          {
            "value": "ghibli",
            "label": "Studio Ghibli"
          },
          {
            "value": "comic",
            "label": "Comic Book"
          },
          {
            "value": "marvel",
            "label": "Marvel Style"
          },
          {
            "value": "chibi",
            "label": "Chibi/Cute"
          },
          {
            "value": "watercolor",
            "label": "Watercolor"
          },
          {
            "value": "oilpainting",
            "label": "Oil Painting"
          },
          {
            "value": "sketch",
            "label": "Sketch"
          },
          {
            "value": "lineart",
            "label": "Line Art"
          },
          {
            "value": "popart",
            "label": "Pop Art"
          },
          {
            "value": "graffiti",
            "label": "Graffiti"
          },
          {
            "value": "crayon-anak",
            "label": "Krayon Anak"
          },
          {
            "value": "digital",
            "label": "Digital Art"
          },
          {
            "value": "vector",
            "label": "Vector Art"
          },
          {
            "value": "minimalist",
            "label": "Minimalist"
          },
          {
            "value": "geometric",
            "label": "Geometric"
          },
          {
            "value": "neon",
            "label": "Neon Style"
          },
          {
            "value": "cyberpunk",
            "label": "Cyberpunk"
          },
          {
            "value": "instagram",
            "label": "Instagram"
          },
          {
            "value": "tiktok",
            "label": "TikTok Viral"
          },
          {
            "value": "sticker",
            "label": "Sticker"
          },
          {
            "value": "emoji",
            "label": "Emoji Style"
          },
          {
            "value": "retro",
            "label": "Retro/Vintage"
          },
          {
            "value": "noir",
            "label": "Film Noir"
          },
          {
            "value": "pastel",
            "label": "Pastel Soft"
          },
          {
            "value": "monochrome",
            "label": "Monochrome"
          },
          {
            "value": "fantasy",
            "label": "Fantasy Art"
          },
          {
            "value": "gothic",
            "label": "Gothic Dark"
          },
          {
            "value": "kawaii",
            "label": "Kawaii Japan"
          },
          {
            "value": "realistic",
            "label": "Realistic"
          },
          {
            "value": "portrait",
            "label": "Portrait Art"
          },
          {
            "value": "editorial",
            "label": "Editorial"
          },
          {
            "value": "vogue",
            "label": "Vogue Fashion"
          },
          {
            "value": "wayang",
            "label": "Wayang Style"
          },
          {
            "value": "batik",
            "label": "Batik Pattern"
          },
          {
            "value": "flatcartoon",
            "label": "Flat Cartoon"
          },
          {
            "value": "custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "karikatur-exaggeration-options",
        "label": "Tingkat Exaggeration",
        "type": "choice",
        "defaultValue": "moderate",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "subtle",
            "label": "Subtle"
          },
          {
            "value": "moderate",
            "label": "Moderate"
          },
          {
            "value": "extreme",
            "label": "Extreme"
          }
        ]
      },
      {
        "id": "karikatur-background-options",
        "label": "Background",
        "type": "choice",
        "defaultValue": "transparent",
        "required": false,
        "options": [
          {
            "value": "transparent",
            "label": "Transparan"
          },
          {
            "value": "solid",
            "label": "Solid Color"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          },
          {
            "value": "scene",
            "label": "Scene"
          }
        ]
      },
      {
        "id": "karikatur-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "karikatur-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "karikatur-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a caricature of the uploaded person using the selected illustration style and scene. Retain recognizable facial features.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "halu",
    "label": "Halu Idol",
    "description": "Susun adegan imajinatif bersama referensi idol atau karakter.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "halu-image-input",
        "label": "Pilih Fotomu Klik atau seret gambar",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "halu-idol-image-input",
        "label": "Pilih Foto Idolamu Klik atau seret gambar",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "halu-moment-desc-input",
        "label": "Deskripsi Momen (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kencan pertama...",
        "role": "prompt"
      },
      {
        "id": "halu-photo-style-input",
        "label": "Gaya Foto (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Gaya foto polaroid...",
        "role": "prompt"
      },
      {
        "id": "halu-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "halu-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Create the requested imagined scene from the uploaded references, preserving recognizable identities and applying the chosen setting.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "tattoo-editor",
    "label": "Tattoo Editor",
    "description": "Pratinjau desain tattoo pada bagian tubuh yang dipilih.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "tattoo-image-upload",
        "label": "Upload Body Photo",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "tattoo-description",
        "label": "Describe Your Tattoo",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Describe the tattoo you want... (e.g., Dragon with wings, rose flower, tribal pattern, geometric mandala, Japanese koi fish, etc.)",
        "role": "prompt"
      },
      {
        "id": "tattoo-style-selection",
        "label": "Tattoo Style",
        "type": "choice",
        "defaultValue": "Realistic",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Realistic",
            "label": "Realistic"
          },
          {
            "value": "Traditional",
            "label": "Traditional"
          },
          {
            "value": "Minimalist",
            "label": "Minimalist"
          },
          {
            "value": "Watercolor",
            "label": "Watercolor"
          },
          {
            "value": "Tribal",
            "label": "Tribal"
          },
          {
            "value": "Japanese",
            "label": "Japanese"
          },
          {
            "value": "Neo-Traditional",
            "label": "Neo-Traditional"
          },
          {
            "value": "Geometric",
            "label": "Geometric"
          },
          {
            "value": "Blackwork",
            "label": "Blackwork"
          },
          {
            "value": "Dotwork",
            "label": "Dotwork"
          }
        ]
      },
      {
        "id": "tattoo-placement-selection",
        "label": "Body Placement",
        "type": "choice",
        "defaultValue": "Arm",
        "required": false,
        "options": [
          {
            "value": "Arm",
            "label": "Arm"
          },
          {
            "value": "Forearm",
            "label": "Forearm"
          },
          {
            "value": "Chest",
            "label": "Chest"
          },
          {
            "value": "Back",
            "label": "Back"
          },
          {
            "value": "Shoulder",
            "label": "Shoulder"
          },
          {
            "value": "Leg",
            "label": "Leg"
          },
          {
            "value": "Thigh",
            "label": "Thigh"
          },
          {
            "value": "Neck",
            "label": "Neck"
          }
        ]
      },
      {
        "id": "tattoo-size-selection",
        "label": "Size",
        "type": "choice",
        "defaultValue": "Medium",
        "required": false,
        "options": [
          {
            "value": "Small",
            "label": "Small"
          },
          {
            "value": "Medium",
            "label": "Medium"
          },
          {
            "value": "Large",
            "label": "Large"
          }
        ]
      },
      {
        "id": "tattoo-color-selection",
        "label": "Color",
        "type": "choice",
        "defaultValue": "Black & Gray",
        "required": false,
        "options": [
          {
            "value": "Black & Gray",
            "label": "B&W"
          },
          {
            "value": "Full Color",
            "label": "Color"
          },
          {
            "value": "Mixed",
            "label": "Mixed"
          }
        ]
      },
      {
        "id": "tattoo-aspect-ratio-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "tattoo-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Place the supplied or described tattoo on the selected body area with believable perspective and lighting. Preserve the person's appearance.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "sticker",
    "label": "Sticker Studio",
    "description": "Ubah foto menjadi sticker dengan gaya dan ekspresi pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "sticker-image-input",
        "label": "Unggah Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "sticker-prompt-addition",
        "label": "Tambahkan gaya spesifik (opsional):",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: gaya pixel art, cat air, komik"
      },
      {
        "id": "sticker-tolerance-slider",
        "label": "Geser untuk Atur Toleransi Latar",
        "type": "range",
        "defaultValue": 160.0,
        "required": false,
        "min": 1.0,
        "max": 255.0
      },
      {
        "id": "sticker-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "sticker",
        "required": false,
        "options": [
          {
            "value": "sticker",
            "label": "Sticker Tempel"
          },
          {
            "value": "sticker-pack-studio",
            "label": "Sticker Pack"
          }
        ]
      },
      {
        "id": "sticker-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "sticker-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      },
      {
        "id": "sticker-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Create a sticker-style illustration from the supplied subject using the selected expression, text and outline style.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "sticker-pack-studio",
        "label": "Sticker Pack Studio",
        "description": "Buat paket sticker dengan ekspresi yang konsisten.",
        "iconId": "wand",
        "group": "personal-style",
        "kind": "image",
        "fields": [
          {
            "id": "sticker-pack-studio-image-input",
            "label": "Klik untuk upload foto wajah Foto close-up wajah — terlihat jelas, pencahayaan terang",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "sticker-pack-studio-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "sticker-pack-studio",
            "required": false,
            "options": [
              {
                "value": "sticker",
                "label": "Sticker Tempel"
              },
              {
                "value": "sticker-pack-studio",
                "label": "Sticker Pack"
              }
            ]
          },
          {
            "id": "sticker-pack-studio-template-options",
            "label": "Pilih Template Pack",
            "type": "choice",
            "defaultValue": "expression-pack-10",
            "required": false,
            "options": [
              {
                "value": "expression-pack-10",
                "label": "Expression Pack"
              },
              {
                "value": "mood-pack",
                "label": "Mood Pack"
              },
              {
                "value": "reaction-pack",
                "label": "Reaction Pack"
              },
              {
                "value": "pacar-pack",
                "label": "Untuk Pacar"
              },
              {
                "value": "anak-pack",
                "label": "Untuk Anak"
              }
            ]
          },
          {
            "id": "sticker-pack-studio-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "4:5",
                "label": "4:5"
              },
              {
                "value": "9:16",
                "label": "9:16"
              },
              {
                "value": "3:4",
                "label": "3:4"
              }
            ]
          },
          {
            "id": "sticker-pack-studio-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          },
          {
            "id": "sticker-pack-studio-result-count",
            "label": "Jumlah hasil",
            "type": "choice",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "10",
                "label": "10"
              }
            ],
            "defaultValue": "4",
            "required": false,
            "role": "count"
          }
        ],
        "promptIntent": "Create a cohesive sticker-pack sheet using the supplied subject identity, selected expressions and style.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "story-update",
    "label": "Story Update",
    "description": "Buat foto untuk story dengan adegan dan pesan pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "story-update-photo-upload",
        "label": "Upload Fotomu",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "story-update-economic-status",
        "label": "Pilih Kelas Ekonomi:",
        "type": "select",
        "defaultValue": "gaji_bawah_umk",
        "required": false,
        "options": [
          {
            "value": "gaji_bawah_umk",
            "label": "Gaji di Bawah UMK"
          },
          {
            "value": "gaji_sesuai_umk",
            "label": "Gaji Sesuai UMK"
          },
          {
            "value": "gaji_diatas_umk",
            "label": "Gaji di Atas UMK"
          },
          {
            "value": "orang_kaya_baru",
            "label": "Orang Kaya Baru"
          },
          {
            "value": "orang_kaya_lama",
            "label": "Orang Kaya Lama"
          }
        ]
      },
      {
        "id": "story-update-theme",
        "label": "Pilih Tema Story:",
        "type": "select",
        "defaultValue": "makan",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "makan",
            "label": "Makan"
          },
          {
            "value": "jalan-jalan",
            "label": "Jalan-jalan"
          },
          {
            "value": "kerja",
            "label": "Kerja"
          },
          {
            "value": "kuliah",
            "label": "Kuliah"
          },
          {
            "value": "olahraga",
            "label": "Olahraga"
          },
          {
            "value": "nongkrong",
            "label": "Nongkrong"
          }
        ]
      },
      {
        "id": "story-update-specific-activity",
        "label": "Kegiatan Spesifik (Opsional):",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Makan sate di Gasibu, Bandung"
      },
      {
        "id": "story-update-photo-style",
        "label": "Tipe foto",
        "type": "choice",
        "defaultValue": "sendiri",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "sendiri",
            "label": "Sendiri"
          },
          {
            "value": "bareng_temen",
            "label": "Bareng Temen"
          }
        ]
      },
      {
        "id": "story-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "story-update-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "story-update-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a social-media story image using the uploaded subject, chosen scene and supplied text, at the selected aspect ratio.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "touring",
    "label": "Foto Touring",
    "description": "Buat foto touring dengan kendaraan dan lokasi pilihan.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "touring-bg-input",
        "label": "Custom Background (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "touring-road-options",
        "label": "Background Jalanan",
        "type": "choice",
        "defaultValue": "indonesia",
        "required": false,
        "options": [
          {
            "value": "indonesia",
            "label": "🇮🇩 Indonesia"
          },
          {
            "value": "jepang",
            "label": "🇯🇵 Jepang"
          },
          {
            "value": "amerika",
            "label": "🇺🇸 Amerika"
          },
          {
            "value": "eropa",
            "label": "🇨🇭 Eropa"
          },
          {
            "value": "australia",
            "label": "🇦🇺 Australia"
          },
          {
            "value": "new-zealand",
            "label": "🇳🇿 New Zealand"
          },
          {
            "value": "thailand",
            "label": "🇹🇭 Thailand"
          },
          {
            "value": "bali",
            "label": "🌾 Bali"
          },
          {
            "value": "dubai",
            "label": "🇦🇪 Dubai"
          },
          {
            "value": "iceland",
            "label": "🇮🇸 Iceland"
          },
          {
            "value": "vietnam",
            "label": "🇻🇳 Vietnam"
          },
          {
            "value": "scotland",
            "label": "🏴 Scotland"
          }
        ]
      },
      {
        "id": "touring-mood-options",
        "label": "Tema Suasana",
        "type": "choice",
        "defaultValue": "golden-hour",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "golden-hour",
            "label": "🌅 Golden Hour"
          },
          {
            "value": "blue-hour",
            "label": "🌆 Blue Hour"
          },
          {
            "value": "siang-cerah",
            "label": "☀️ Siang Cerah"
          },
          {
            "value": "dramatis",
            "label": "⛈️ Dramatis"
          },
          {
            "value": "kabut-pagi",
            "label": "🌫️ Kabut Pagi"
          },
          {
            "value": "malam-kota",
            "label": "🌃 Malam Kota"
          },
          {
            "value": "sunrise",
            "label": "🌄 Sunrise"
          },
          {
            "value": "hujan",
            "label": "🌧️ Hujan"
          }
        ]
      },
      {
        "id": "touring-angle-options",
        "label": "Angle Foto",
        "type": "choice",
        "defaultValue": "side-profile",
        "required": false,
        "options": [
          {
            "value": "side-profile",
            "label": "📸 Side Profile"
          },
          {
            "value": "front-3-4",
            "label": "🎯 Front 3/4"
          },
          {
            "value": "action-shot",
            "label": "💨 Action Shot"
          },
          {
            "value": "low-angle",
            "label": "⬆️ Low Angle"
          },
          {
            "value": "high-angle",
            "label": "🚁 High Angle"
          },
          {
            "value": "rear-view",
            "label": "🛣️ Rear View"
          },
          {
            "value": "close-up",
            "label": "🔍 Close-up"
          },
          {
            "value": "wide-landscape",
            "label": "🌄 Wide Landscape"
          },
          {
            "value": "tracking",
            "label": "🏍️ Tracking"
          },
          {
            "value": "pov-helmet",
            "label": "👁️ POV Helmet"
          }
        ]
      },
      {
        "id": "touring-aspect-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "21:9",
            "label": "21:9"
          }
        ]
      },
      {
        "id": "touring-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "touring-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a touring photograph using the supplied rider and vehicle references, selected destination and scene.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "vehicle-modifier",
    "label": "Vehicle Modifier",
    "description": "Pratinjau modifikasi visual kendaraan dari foto referensi.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "vehicle-image-upload",
        "label": "Upload Foto Mobil/Motor",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "vehicle-custom-description",
        "label": "Deskripsi Custom (Optional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Tambahkan wide body kit agresif, cat hitam matte dengan racing stripes merah, velg racing 19 inch, dll...",
        "role": "prompt"
      },
      {
        "id": "vehicle-type-selection",
        "label": "Jenis Kendaraan",
        "type": "choice",
        "defaultValue": "car",
        "required": false,
        "options": [
          {
            "value": "car",
            "label": "Mobil"
          },
          {
            "value": "motorcycle",
            "label": "Motor"
          }
        ]
      },
      {
        "id": "vehicle-mod-category-selection",
        "label": "Kategori Modifikasi",
        "type": "choice",
        "defaultValue": "bodykit",
        "required": false,
        "options": [
          {
            "value": "bodykit",
            "label": "Body Kit"
          },
          {
            "value": "wheels",
            "label": "Wheels/Velg"
          },
          {
            "value": "paint",
            "label": "Paint/Color"
          },
          {
            "value": "lowering",
            "label": "Lowering/Stance"
          },
          {
            "value": "spoiler",
            "label": "Spoiler/Wing"
          },
          {
            "value": "lighting",
            "label": "Lighting/LED"
          },
          {
            "value": "interior",
            "label": "Interior"
          },
          {
            "value": "full-custom",
            "label": "Full Custom"
          }
        ]
      },
      {
        "id": "vehicle-style-selection",
        "label": "Style Modifikasi",
        "type": "choice",
        "defaultValue": "jdm",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "jdm",
            "label": "JDM Style"
          },
          {
            "value": "vip",
            "label": "VIP/Luxury"
          },
          {
            "value": "racing",
            "label": "Racing/Track"
          },
          {
            "value": "stance",
            "label": "Stance/Slammed"
          },
          {
            "value": "offroad",
            "label": "Off-road/4x4"
          },
          {
            "value": "classic",
            "label": "Classic/Retro"
          },
          {
            "value": "modern",
            "label": "Modern/Futuristic"
          },
          {
            "value": "custom",
            "label": "Custom/Unique"
          }
        ]
      },
      {
        "id": "vehicle-aspect-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9 Landscape"
          },
          {
            "value": "1:1",
            "label": "1:1 Square"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          }
        ]
      },
      {
        "id": "vehicle-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Apply the requested vehicle modifications to the uploaded vehicle while preserving its identity and realistic proportions.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "podcast",
    "label": "Studio Podcast",
    "description": "Buat potret dalam suasana studio podcast.",
    "iconId": "wand",
    "group": "personal-style",
    "kind": "image",
    "fields": [
      {
        "id": "pod-photo-upload",
        "label": "Klik untuk upload foto karakter Foto full karakter — AI yang dudukkan di depan mic",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "pod-custom-theme",
        "label": "Tema Suasana",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: studio outdoor rooftop sunset, podcast di kapal, dll",
        "role": "style"
      },
      {
        "id": "pod-custom-prompt",
        "label": "Custom Prompt (opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis arahan tambahan untuk AI...",
        "role": "prompt"
      },
      {
        "id": "pod-themes-grid",
        "label": "Tema Suasana",
        "type": "choice",
        "defaultValue": "studio-pro",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "studio-pro",
            "label": "Studio Profesional"
          },
          {
            "value": "cozy-home",
            "label": "Cozy Home Studio"
          },
          {
            "value": "neon-gaming",
            "label": "Neon / Gaming"
          },
          {
            "value": "dark-moody",
            "label": "Dark Moody Cinematic"
          },
          {
            "value": "custom",
            "label": "Custom (Suasana Sendiri)"
          }
        ]
      },
      {
        "id": "pod-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:3",
            "label": "4:3"
          }
        ]
      },
      {
        "id": "pod-count-options",
        "label": "Jumlah hasil",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a podcast-studio portrait preserving the uploaded person's identity and applying the selected microphone, studio and composition.",
    "isNew": true,
    "hidden": false
  },
  {
    "id": "photo-editor",
    "label": "Photo Editor Pro",
    "description": "Edit foto langsung dengan preset dan kontrol cahaya/warna.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "local",
    "fields": [
      {
        "id": "photoeditor-image-input",
        "label": "Klik atau seret foto di sini PNG, JPG, WEBP, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "photoeditor-brightness",
        "label": "Brightness",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-contrast",
        "label": "Contrast",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-saturation",
        "label": "Saturation",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0,
        "role": "ratio"
      },
      {
        "id": "photoeditor-warmth",
        "label": "Warmth",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-highlights",
        "label": "Highlights",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-shadows",
        "label": "Shadows",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -100.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-sharpness",
        "label": "Sharpness",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": 0.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-vignette",
        "label": "Vignette",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": 0.0,
        "max": 100.0,
        "step": 1.0
      },
      {
        "id": "photoeditor-preset-options",
        "label": "Preset Filters",
        "type": "choice",
        "defaultValue": "none",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "none",
            "label": "Original"
          },
          {
            "value": "cinematic",
            "label": "Cinematic"
          },
          {
            "value": "vintage",
            "label": "Vintage"
          },
          {
            "value": "moody",
            "label": "Moody"
          },
          {
            "value": "vibrant",
            "label": "Vibrant"
          },
          {
            "value": "warm",
            "label": "Warm Glow"
          },
          {
            "value": "cool",
            "label": "Cool Tone"
          },
          {
            "value": "bw",
            "label": "B&W Classic"
          },
          {
            "value": "sepia",
            "label": "Sepia"
          },
          {
            "value": "dramatic",
            "label": "Dramatic"
          },
          {
            "value": "soft",
            "label": "Soft Dream"
          },
          {
            "value": "hdr",
            "label": "HDR"
          },
          {
            "value": "golden",
            "label": "Golden Hour"
          },
          {
            "value": "film",
            "label": "Film Grain"
          },
          {
            "value": "neon",
            "label": "Neon"
          },
          {
            "value": "pastel",
            "label": "Pastel"
          },
          {
            "value": "urban",
            "label": "Urban"
          },
          {
            "value": "sunset",
            "label": "Sunset"
          },
          {
            "value": "portrait",
            "label": "Portrait Pro"
          },
          {
            "value": "landscape",
            "label": "Landscape"
          }
        ]
      }
    ],
    "promptIntent": "Apply local image adjustments and selected presets to the uploaded photo, preserving the original image dimensions for export.",
    "isNew": false,
    "hidden": false,
    "capability": "photo-editor"
  },
  {
    "id": "ai-beauty",
    "label": "AI Beauty Editor",
    "description": "Retouch foto dengan pilihan penyesuaian wajah dan kulit.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "beauty-image-input",
        "label": "Klik atau seret foto di sini PNG, JPG, WEBP, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "beauty-custom-request",
        "label": "Custom Request (Optional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Ketik keinginan custom Anda di sini, contoh: 'buat mata lebih tajam dan bibir lebih merah', 'kulit lebih glowing dan pipi lebih chubby', dll.",
        "role": "prompt"
      },
      {
        "id": "beauty-intensity-options",
        "label": "Intensity",
        "type": "choice",
        "defaultValue": "moderate",
        "required": false,
        "options": [
          {
            "value": "subtle",
            "label": "Subtle"
          },
          {
            "value": "moderate",
            "label": "Moderate"
          },
          {
            "value": "strong",
            "label": "Strong"
          }
        ]
      },
      {
        "id": "beauty-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ]
      },
      {
        "id": "beauty-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Retouch the uploaded portrait according to the chosen adjustments while preserving identity and natural texture.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "photo-restoration",
    "label": "Restorasi Foto",
    "description": "Perbaiki foto lama, kerusakan, dan warna yang pudar.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "pr-photo-input",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "pr-mode-select",
        "label": "Restoration Mode",
        "type": "select",
        "defaultValue": "old-photo",
        "required": false,
        "options": [
          {
            "value": "old-photo",
            "label": "Old Photo Restoration (Foto Lama)"
          },
          {
            "value": "damaged",
            "label": "Damaged Photo Repair (Foto Rusak)"
          },
          {
            "value": "colorize",
            "label": "Colorize B&W (Warnai Hitam-Putih)"
          },
          {
            "value": "enhance",
            "label": "Quality Enhancement (Tingkatkan Kualitas)"
          },
          {
            "value": "deblur",
            "label": "Deblur & Sharpen (Hilangkan Blur)"
          },
          {
            "value": "denoise",
            "label": "Denoise (Hilangkan Noise)"
          }
        ]
      },
      {
        "id": "photo-restoration-choice-1",
        "label": "Intensity Level",
        "type": "choice",
        "defaultValue": "light",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "light",
            "label": "Light"
          },
          {
            "value": "medium",
            "label": "Medium"
          },
          {
            "value": "strong",
            "label": "Strong"
          }
        ]
      },
      {
        "id": "photo-restoration-choice-2",
        "label": "Aspect Ratio",
        "type": "choice",
        "defaultValue": "original",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "original",
            "label": "Original"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:3",
            "label": "4:3"
          }
        ]
      },
      {
        "id": "pr-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "photo-restoration-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Restore the supplied photograph by repairing visible damage and applying the selected color treatment. Preserve the original people and scene.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "object-remover",
    "label": "Hapus Object",
    "description": "Hapus objek yang dideskripsikan dan isi kembali latarnya.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "remover-upload-input",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "remover-brush-size",
        "label": "Ukuran Kuas: 20 px",
        "type": "range",
        "defaultValue": 20.0,
        "required": false,
        "min": 5.0,
        "max": 100.0
      },
      {
        "id": "remover-watermark-text",
        "label": "Teks Watermark Spesifik (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Cth: shutterstock, getty images, @username (kosongkan untuk auto-detect semua)"
      },
      {
        "id": "object-remover-choice-1",
        "label": "Pilih Mode Penghapusan",
        "type": "choice",
        "defaultValue": "auto",
        "required": false,
        "options": [
          {
            "value": "auto",
            "label": "Otomatis (AI) AI deteksi & hapus objek mengganggu"
          },
          {
            "value": "manual",
            "label": "Manual (Brush) Pilih area dengan kuas"
          },
          {
            "value": "watermark",
            "label": "Hapus Watermark Hapus teks, logo & watermark"
          }
        ]
      },
      {
        "id": "object-remover-choice-2",
        "label": "Jumlah Variasi Hasil",
        "type": "choice",
        "defaultValue": "2",
        "required": false,
        "options": [
          {
            "value": "2",
            "label": "2 Variasi"
          },
          {
            "value": "3",
            "label": "3 Variasi"
          },
          {
            "value": "4",
            "label": "4 Variasi"
          }
        ]
      },
      {
        "id": "object-remover-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "object-remover-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      },
      {
        "id": "object-remover-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Remove only the user-described objects from the uploaded image and reconstruct a coherent background. Keep all remaining subjects unchanged.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "face-swap",
    "label": "Face Swap",
    "description": "Ganti wajah pada foto tujuan memakai referensi wajah.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "face-reference",
        "label": "Foto wajah referensi",
        "type": "file",
        "required": true,
        "defaultValue": "",
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "face-target",
        "label": "Foto tujuan",
        "type": "file",
        "required": false,
        "defaultValue": "",
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "face-swap-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "face-swap-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      },
      {
        "id": "face-swap-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Replace the selected face in the target photo using the uploaded face reference, matching pose, light and proportions.",
    "isNew": false,
    "hidden": false,
    "limitations": [
      "Referensi menggunakan layanan Face Swap eksternal. Studio ini menggunakan provider gambar yang dikonfigurasi; kualitas penggantian wajah bergantung pada model."
    ]
  },
  {
    "id": "remove-bg",
    "label": "Hapus Background",
    "description": "Pisahkan subjek foto dari latar belakangnya.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "cutout-image",
        "label": "Foto subjek",
        "type": "file",
        "required": true,
        "defaultValue": "",
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "remove-bg-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "remove-bg-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      },
      {
        "id": "remove-bg-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Isolate the main subject of the uploaded image from the background, preserving edges and product details. Request a clean cutout-style result.",
    "isNew": false,
    "hidden": false,
    "limitations": [
      "Referensi menggunakan layanan cutout eksternal. Transparansi dan ketepatan tepi bergantung pada hasil provider gambar."
    ]
  },
  {
    "id": "bg-remover",
    "label": "Ubah Background",
    "description": "Ubah latar foto sambil mempertahankan subjek utama.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "bgremover-input",
        "label": "📸 Klik atau seret foto PNG, JPG, HEIC (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "bgremover-custom-input",
        "label": "✨ Deskripsikan Background:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: studio putih profesional, gradient pink soft, ruangan modern..."
      },
      {
        "id": "bgremover-refbg-input",
        "label": "Klik untuk upload foto background PNG, JPG (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "bgremover-bg-options",
        "label": "Pilih Background Baru",
        "type": "choice",
        "defaultValue": "transparent",
        "required": false,
        "options": [
          {
            "value": "transparent",
            "label": "Transparan"
          },
          {
            "value": "blur",
            "label": "Blur"
          },
          {
            "value": "white",
            "label": "Putih"
          },
          {
            "value": "black",
            "label": "Hitam"
          },
          {
            "value": "gradient-blue",
            "label": "Biru"
          },
          {
            "value": "gradient-purple",
            "label": "Ungu"
          },
          {
            "value": "custom",
            "label": "Kustom"
          },
          {
            "value": "reference-bg",
            "label": "Foto BG"
          }
        ]
      },
      {
        "id": "bgremover-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "bgremover-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "bg-remover-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Replace the uploaded image background with the selected scene or background reference. Preserve the main subject's identity and edges.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "photo-extender",
    "label": "Perluas Foto",
    "description": "Perluas komposisi foto menuju rasio yang dipilih.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "extender-input",
        "label": "📸 Klik atau seret foto PNG, JPG, HEIC (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "extender-direction-options",
        "label": "Arah Perluasan",
        "type": "choice",
        "defaultValue": "all",
        "required": false,
        "options": [
          {
            "value": "all",
            "label": "Semua"
          },
          {
            "value": "horizontal",
            "label": "Horizontal"
          },
          {
            "value": "vertical",
            "label": "Vertikal"
          },
          {
            "value": "left",
            "label": "Kiri"
          },
          {
            "value": "right",
            "label": "Kanan"
          },
          {
            "value": "top",
            "label": "Atas"
          },
          {
            "value": "bottom",
            "label": "Bawah"
          }
        ]
      },
      {
        "id": "extender-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "4:3",
            "label": "4:3"
          }
        ]
      },
      {
        "id": "extender-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "photo-extender-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Extend the image beyond its original edges to match the requested composition and aspect ratio. Preserve the original central subject and generate a coherent surrounding scene.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "passport-photo",
    "label": "Pas Foto Warna",
    "description": "Susun pas foto dengan warna latar dan pakaian pilihan.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "passport-input",
        "label": "Klik atau seret foto close-up",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "passport-custom-attire-input",
        "label": "Pakaian Kustom:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: kemeja batik..."
      },
      {
        "id": "passport-custom-attire-ref-input",
        "label": "Unggah referensi",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "passport-bg-options",
        "label": "Pilih Warna Background",
        "type": "choice",
        "defaultValue": "Merah",
        "required": false,
        "options": [
          {
            "value": "Merah",
            "label": "Merah"
          },
          {
            "value": "Biru",
            "label": "Biru"
          },
          {
            "value": "Putih",
            "label": "Putih"
          },
          {
            "value": "Abu-abu",
            "label": "Abu-abu"
          }
        ]
      },
      {
        "id": "passport-attire-options",
        "label": "Mode Pakaian Otomatis",
        "type": "choice",
        "defaultValue": "Ganti dengan Jas Hitam dan Dasi",
        "required": false,
        "options": [
          {
            "value": "Ganti dengan Jas Hitam dan Dasi",
            "label": "Jas + Dasi"
          },
          {
            "value": "Ganti dengan Blazer Formal Wanita",
            "label": "Blazer"
          },
          {
            "value": "Ganti dengan Kemeja Putih Polos",
            "label": "Kemeja"
          },
          {
            "value": "Sekolah",
            "label": "Sekolah"
          },
          {
            "value": "Kustom",
            "label": "Kustom"
          }
        ]
      },
      {
        "id": "passport-school-options",
        "label": "Pilih Jenjang:",
        "type": "choice",
        "defaultValue": "SD (putih merah)",
        "required": false,
        "options": [
          {
            "value": "SD (putih merah)",
            "label": "SD"
          },
          {
            "value": "SMP (putih biru)",
            "label": "SMP"
          },
          {
            "value": "SMA (putih abu-abu)",
            "label": "SMA"
          }
        ]
      },
      {
        "id": "passport-size-options",
        "label": "Ukuran Output",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "options": [
          {
            "value": "2:3",
            "label": "2x3"
          },
          {
            "value": "3:4",
            "label": "3x4"
          },
          {
            "value": "4:6",
            "label": "4x6"
          }
        ]
      },
      {
        "id": "passport-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "passport-photo-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "passport-photo-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Create a formal passport-style portrait preserving identity, with the selected background color, clothing and framing. Follow supplied dimensions without claiming official compliance.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "photo-angle",
    "label": "Photo Angle",
    "description": "Buat variasi sudut kamera dari foto referensi.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "pa-photo-upload",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "photo-angle-pa-preset",
        "label": "Angle Presets",
        "type": "choice",
        "defaultValue": "all",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "all",
            "label": "All Angles (6 Photos) Front, Side, Top, Bottom, 45°, Back"
          },
          {
            "value": "product",
            "label": "Product View (6 Photos) 360° rotation views"
          },
          {
            "value": "portrait",
            "label": "Portrait Style (6 Photos) Face angles & perspectives"
          }
        ]
      },
      {
        "id": "photo-angle-choice-2",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "photo-angle-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "photo-angle-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "6",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Create the requested camera-angle view of the uploaded subject or product. Maintain recognizable identity, details and consistent lighting.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "style-matcher",
    "label": "Style Matcher",
    "description": "Terapkan gaya visual dari gambar referensi ke foto Anda.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "image",
    "fields": [
      {
        "id": "sm-your-photo",
        "label": "Foto Anda",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "sm-ref-photo",
        "label": "Foto Referensi (Gaya)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "style-matcher-sm-strength",
        "label": "Kekuatan gaya",
        "type": "choice",
        "defaultValue": "moderate",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "subtle",
            "label": "Subtle (30%) Gaya halus, natural"
          },
          {
            "value": "moderate",
            "label": "Moderate (60%) Balance, recommended"
          },
          {
            "value": "strong",
            "label": "Strong (90%) Gaya kuat, dramatic"
          }
        ]
      },
      {
        "id": "style-matcher-choice-2",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "style-matcher-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "style-matcher-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Apply the reference image's visual styling, palette and mood to the target photo while preserving its subject and identity.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "image-analyzer",
    "label": "Image to Prompt",
    "description": "Uraikan foto menjadi prompt dengan detail dan bahasa pilihan.",
    "iconId": "sliders",
    "group": "photo-editing",
    "kind": "text",
    "fields": [
      {
        "id": "analyzer-image-upload",
        "label": "Klik untuk upload gambar PNG, JPG, WEBP, HEIC (max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "analyzer-detail-level",
        "label": "Level Detail Analisis",
        "type": "choice",
        "defaultValue": "detailed",
        "required": false,
        "options": [
          {
            "value": "basic",
            "label": "Basic"
          },
          {
            "value": "detailed",
            "label": "Detailed"
          },
          {
            "value": "expert",
            "label": "Expert"
          }
        ]
      },
      {
        "id": "analyzer-prompt-format",
        "label": "Format Prompt",
        "type": "choice",
        "defaultValue": "general",
        "required": false,
        "options": [
          {
            "value": "general",
            "label": "General"
          },
          {
            "value": "photography",
            "label": "Photography"
          },
          {
            "value": "art",
            "label": "Art Style"
          },
          {
            "value": "product",
            "label": "Product"
          },
          {
            "value": "portrait",
            "label": "Portrait"
          },
          {
            "value": "scene",
            "label": "Scene"
          }
        ]
      },
      {
        "id": "analyzer-language",
        "label": "Bahasa Output",
        "type": "choice",
        "defaultValue": "id",
        "required": false,
        "role": "language",
        "options": [
          {
            "value": "id",
            "label": "Bahasa Indonesia"
          },
          {
            "value": "en",
            "label": "English"
          }
        ]
      },
      {
        "id": "analyzer-output-format",
        "label": "Format Output",
        "type": "choice",
        "defaultValue": "text",
        "required": false,
        "options": [
          {
            "value": "text",
            "label": "Text"
          },
          {
            "value": "json",
            "label": "JSON"
          }
        ]
      },
      {
        "id": "image-analyzer-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Analyze the uploaded image and write a descriptive prompt covering subject, scene, composition, lighting, colors and style at the selected level of detail.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "logo-generator",
    "label": "Logo Generator",
    "description": "Buat konsep logo dari nama dan karakter merek.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "logo-brand-name",
        "label": "Nama Brand/Perusahaan *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: TechNova, Cafe Delight"
      },
      {
        "id": "logo-tagline",
        "label": "Tagline (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Innovation for Tomorrow"
      },
      {
        "id": "logo-business-desc",
        "label": "Deskripsi Bisnis *",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Jelaskan apa yang dilakukan bisnis Anda, nilai-nilai, dan target audience...",
        "role": "prompt"
      },
      {
        "id": "logo-ref-input",
        "label": "Upload referensi logo/inspirasi Logo yang Anda suka untuk referensi style",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "logo-industry-options",
        "label": "Industri",
        "type": "choice",
        "defaultValue": "Technology",
        "required": false,
        "options": [
          {
            "value": "Technology",
            "label": "Tech"
          },
          {
            "value": "Food & Beverage",
            "label": "F&B"
          },
          {
            "value": "Fashion & Beauty",
            "label": "Fashion"
          },
          {
            "value": "Health & Wellness",
            "label": "Health"
          },
          {
            "value": "Education",
            "label": "Edu"
          },
          {
            "value": "Finance",
            "label": "Finance"
          },
          {
            "value": "Real Estate",
            "label": "Property"
          },
          {
            "value": "Creative & Art",
            "label": "Creative"
          },
          {
            "value": "Sports & Fitness",
            "label": "Sports"
          }
        ]
      },
      {
        "id": "logo-type-options",
        "label": "Tipe Logo",
        "type": "choice",
        "defaultValue": "wordmark",
        "required": false,
        "options": [
          {
            "value": "wordmark",
            "label": "Wordmark"
          },
          {
            "value": "symbol",
            "label": "Symbol"
          },
          {
            "value": "combination",
            "label": "Kombinasi"
          },
          {
            "value": "emblem",
            "label": "Emblem"
          }
        ]
      },
      {
        "id": "logo-style-options",
        "label": "Style & Mood",
        "type": "choice",
        "defaultValue": "Minimalist Modern",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Minimalist Modern",
            "label": "Minimalis"
          },
          {
            "value": "Bold & Powerful",
            "label": "Bold"
          },
          {
            "value": "Elegant Luxury",
            "label": "Elegant"
          },
          {
            "value": "Playful & Fun",
            "label": "Playful"
          },
          {
            "value": "Professional Corporate",
            "label": "Corporate"
          },
          {
            "value": "Vintage Retro",
            "label": "Vintage"
          }
        ]
      },
      {
        "id": "logo-color-scheme-options",
        "label": "Skema Warna",
        "type": "choice",
        "defaultValue": "colorful",
        "required": false,
        "options": [
          {
            "value": "colorful",
            "label": "Colorful"
          },
          {
            "value": "monochrome",
            "label": "Mono"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          }
        ]
      },
      {
        "id": "logo-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "logo-generator-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Design an original logo using the supplied brand name, industry, style and colors. Keep the brand text accurate and readable.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "brand-kit-generator",
    "label": "AI Brand Kit Generator",
    "description": "Bangun identitas visual merek dalam satu brand board.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "brandkit-name",
        "label": "Nama Brand *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: TechNova, Cafe Delight"
      },
      {
        "id": "brandkit-description",
        "label": "Deskripsi Bisnis *",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Jelaskan apa yang dilakukan bisnis Anda, nilai-nilai utama, dan apa yang membuat brand Anda unik...",
        "role": "prompt"
      },
      {
        "id": "brandkit-industry-options",
        "label": "Kategori Industri *",
        "type": "choice",
        "defaultValue": "Technology & Software",
        "required": false,
        "options": [
          {
            "value": "Technology & Software",
            "label": "Tech"
          },
          {
            "value": "Food & Beverage",
            "label": "F&B"
          },
          {
            "value": "Fashion & Beauty",
            "label": "Fashion"
          },
          {
            "value": "Health & Wellness",
            "label": "Health"
          },
          {
            "value": "Education & Training",
            "label": "Edu"
          },
          {
            "value": "Finance & Investment",
            "label": "Finance"
          },
          {
            "value": "Real Estate & Property",
            "label": "Property"
          },
          {
            "value": "Creative & Entertainment",
            "label": "Creative"
          },
          {
            "value": "Sports & Fitness",
            "label": "Sports"
          },
          {
            "value": "Home & Living",
            "label": "Home"
          },
          {
            "value": "Travel & Hospitality",
            "label": "Travel"
          },
          {
            "value": "Lainnya",
            "label": "Other"
          }
        ]
      },
      {
        "id": "brandkit-audience-options",
        "label": "Target Audience",
        "type": "choice",
        "defaultValue": "Gen Z (18-24)",
        "required": false,
        "options": [
          {
            "value": "Gen Z (18-24)",
            "label": "Gen Z"
          },
          {
            "value": "Millennials (25-40)",
            "label": "Millennials"
          },
          {
            "value": "Gen X (41-56)",
            "label": "Gen X"
          },
          {
            "value": "Baby Boomers (57+)",
            "label": "Boomers"
          },
          {
            "value": "Parents & Families",
            "label": "Parents"
          },
          {
            "value": "Professionals & Executives",
            "label": "Professionals"
          },
          {
            "value": "Students & Young Adults",
            "label": "Students"
          },
          {
            "value": "Entrepreneurs & Business Owners",
            "label": "Entrepreneurs"
          }
        ]
      },
      {
        "id": "brandkit-personality-options",
        "label": "Brand Personality *",
        "type": "choice",
        "defaultValue": "Modern & Innovative",
        "required": false,
        "options": [
          {
            "value": "Modern & Innovative",
            "label": "Modern"
          },
          {
            "value": "Elegant & Luxurious",
            "label": "Elegant"
          },
          {
            "value": "Playful & Fun",
            "label": "Playful"
          },
          {
            "value": "Minimalist & Clean",
            "label": "Minimalist"
          },
          {
            "value": "Bold & Powerful",
            "label": "Bold"
          },
          {
            "value": "Professional & Corporate",
            "label": "Corporate"
          },
          {
            "value": "Eco-Friendly & Natural",
            "label": "Eco"
          },
          {
            "value": "Trustworthy & Reliable",
            "label": "Trustworthy"
          },
          {
            "value": "Youthful & Energetic",
            "label": "Youthful"
          },
          {
            "value": "Vintage & Classic",
            "label": "Vintage"
          },
          {
            "value": "Warm & Friendly",
            "label": "Friendly"
          },
          {
            "value": "Sophisticated & Premium",
            "label": "Premium"
          }
        ]
      },
      {
        "id": "brandkit-color-options",
        "label": "Preferensi Warna (Opsional)",
        "type": "choice",
        "defaultValue": "Blue (Trust, Professional)",
        "required": false,
        "options": [
          {
            "value": "Blue (Trust, Professional)",
            "label": "● Blue"
          },
          {
            "value": "Red (Energy, Passion)",
            "label": "● Red"
          },
          {
            "value": "Green (Nature, Growth)",
            "label": "● Green"
          },
          {
            "value": "Purple (Luxury, Creative)",
            "label": "● Purple"
          },
          {
            "value": "Orange (Friendly, Energetic)",
            "label": "● Orange"
          },
          {
            "value": "Yellow (Optimistic, Happy)",
            "label": "● Yellow"
          },
          {
            "value": "Pink (Playful, Modern)",
            "label": "● Pink"
          },
          {
            "value": "Black/Gray (Elegant, Timeless)",
            "label": "● Black/Gray"
          },
          {
            "value": "Teal (Modern, Calm)",
            "label": "● Teal"
          }
        ]
      },
      {
        "id": "brandkit-count-selection-grid",
        "label": "Jumlah Logo",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "brand-kit-generator-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Create a cohesive brand identity board with an original logo concept, color palette and typography suggestions from the supplied brand brief.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "mascot-generator",
    "label": "Mascot Generator",
    "description": "Buat karakter mascot sesuai merek, gaya, dan kepribadian.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "mascot-ref-input",
        "label": "Mascot Ref Input",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "mascot-name",
        "label": "Nama Mascot *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Bobby Dragon, Kuma Bear, Luna Cat"
      },
      {
        "id": "mascot-description",
        "label": "Deskripsi Karakter *",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Jelaskan karakteristik mascot: bentuk tubuh, warna, fitur unik, kepribadian...",
        "role": "prompt"
      },
      {
        "id": "mascot-type-options",
        "label": "Tipe Karakter",
        "type": "choice",
        "defaultValue": "Animal",
        "required": false,
        "options": [
          {
            "value": "Animal",
            "label": "Hewan"
          },
          {
            "value": "Robot/Mecha",
            "label": "Robot"
          },
          {
            "value": "Fantasy Creature",
            "label": "Fantasy"
          },
          {
            "value": "Human-like Character",
            "label": "Human"
          },
          {
            "value": "Food Character",
            "label": "Food"
          },
          {
            "value": "Abstract/Geometric",
            "label": "Abstract"
          }
        ]
      },
      {
        "id": "mascot-style-options",
        "label": "Style Visual",
        "type": "choice",
        "defaultValue": "Cute Kawaii",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Cute Kawaii",
            "label": "Kawaii"
          },
          {
            "value": "3D Render",
            "label": "3D"
          },
          {
            "value": "Flat Design",
            "label": "Flat"
          },
          {
            "value": "Cartoon Style",
            "label": "Cartoon"
          },
          {
            "value": "Chibi Style",
            "label": "Chibi"
          },
          {
            "value": "Realistic",
            "label": "Realis"
          }
        ]
      },
      {
        "id": "mascot-personality-options",
        "label": "Personality",
        "type": "choice",
        "defaultValue": "Friendly",
        "required": false,
        "options": [
          {
            "value": "Friendly",
            "label": "Ramah"
          },
          {
            "value": "Energetic",
            "label": "Energik"
          },
          {
            "value": "Brave",
            "label": "Berani"
          },
          {
            "value": "Smart",
            "label": "Pintar"
          },
          {
            "value": "Playful",
            "label": "Ceria"
          },
          {
            "value": "Cool",
            "label": "Keren"
          }
        ]
      },
      {
        "id": "mascot-pose-options",
        "label": "Pose & Action",
        "type": "choice",
        "defaultValue": "Standing",
        "required": false,
        "options": [
          {
            "value": "Standing",
            "label": "Berdiri"
          },
          {
            "value": "Waving",
            "label": "Melambaikan"
          },
          {
            "value": "Jumping",
            "label": "Melompat"
          },
          {
            "value": "Sitting",
            "label": "Duduk"
          }
        ]
      },
      {
        "id": "mascot-bg-options",
        "label": "Background",
        "type": "choice",
        "defaultValue": "transparent",
        "required": false,
        "options": [
          {
            "value": "transparent",
            "label": "Transparan"
          },
          {
            "value": "solid color",
            "label": "Solid"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          }
        ]
      },
      {
        "id": "mascot-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "mascot-generator-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Design an original mascot from the brand brief, chosen species or character, visual style, colors and personality.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "packaging-design",
    "label": "Packaging Design",
    "description": "Buat konsep kemasan dengan identitas dan detail produk.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "packaging-product-upload",
        "label": "Klik untuk upload PNG, JPG, WEBP, HEIC",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "packaging-brand-name",
        "label": "Brand Name (Optional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Masukkan nama brand Anda"
      },
      {
        "id": "packaging-brand-color",
        "label": "Brand Color (Optional)",
        "type": "color",
        "defaultValue": "#92400e",
        "required": false
      },
      {
        "id": "packaging-type-options",
        "label": "Jenis Kemasan",
        "type": "choice",
        "defaultValue": "box",
        "required": false,
        "options": [
          {
            "value": "box",
            "label": "Box/Kardus"
          },
          {
            "value": "pouch",
            "label": "Pouch/Plastik"
          },
          {
            "value": "bottle",
            "label": "Bottle"
          },
          {
            "value": "can",
            "label": "Can/Kaleng"
          },
          {
            "value": "paperbag",
            "label": "Paper Bag"
          },
          {
            "value": "tube",
            "label": "Tube"
          }
        ]
      },
      {
        "id": "packaging-style-options",
        "label": "Style Desain",
        "type": "choice",
        "defaultValue": "minimalist",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "minimalist",
            "label": "Minimalist"
          },
          {
            "value": "luxury",
            "label": "Luxury"
          },
          {
            "value": "eco",
            "label": "Eco-Friendly"
          },
          {
            "value": "modern",
            "label": "Modern"
          },
          {
            "value": "vintage",
            "label": "Vintage"
          },
          {
            "value": "playful",
            "label": "Playful"
          }
        ]
      },
      {
        "id": "packaging-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "packaging-design-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "packaging-design-aspect-ratio",
        "label": "Rasio aspek",
        "type": "choice",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "3:4",
            "label": "3:4"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio"
      }
    ],
    "promptIntent": "Design a packaging concept using the supplied product, brand, package form, text and palette. Keep required text accurate.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "poster-generator",
    "label": "Poster Generator",
    "description": "Susun poster dengan tema, informasi, dan gaya visual pilihan.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "poster-image-input",
        "label": "Upload Foto (Opsional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "poster-type",
        "label": "Jenis Poster",
        "type": "select",
        "defaultValue": "event",
        "required": false,
        "options": [
          {
            "value": "event",
            "label": "Event / Acara"
          },
          {
            "value": "promo",
            "label": "Promosi / Sale / Diskon"
          },
          {
            "value": "social-media",
            "label": "Social Media Post"
          },
          {
            "value": "workshop",
            "label": "Workshop / Pelatihan"
          },
          {
            "value": "seminar",
            "label": "Seminar / Webinar"
          },
          {
            "value": "concert",
            "label": "Konser / Musik"
          },
          {
            "value": "sport",
            "label": "Olahraga / Turnamen"
          },
          {
            "value": "movie",
            "label": "Film / Cinema"
          },
          {
            "value": "food",
            "label": "Makanan / Kuliner"
          },
          {
            "value": "recruitment",
            "label": "Lowongan Kerja"
          },
          {
            "value": "announcement",
            "label": "Pengumuman / Info"
          },
          {
            "value": "custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "poster-title",
        "label": "Judul Poster *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: GRAND OPENING, FESTIVAL MUSIK 2025, FLASH SALE 50%"
      },
      {
        "id": "poster-subtitle",
        "label": "Subjudul / Tagline",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Diskon hingga 70%, Join us for amazing experience"
      },
      {
        "id": "poster-description",
        "label": "Detail Informasi",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tanggal, waktu, lokasi, info penting lainnya...",
        "role": "prompt"
      },
      {
        "id": "poster-contact",
        "label": "Kontak / Website",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Phone, email, website, atau Instagram"
      },
      {
        "id": "poster-generator-choice-1",
        "label": "Tema Warna",
        "type": "choice",
        "defaultValue": "vibrant",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "vibrant",
            "label": "Vibrant"
          },
          {
            "value": "professional",
            "label": "Pro"
          },
          {
            "value": "elegant",
            "label": "Elegant"
          },
          {
            "value": "nature",
            "label": "Nature"
          },
          {
            "value": "sunset",
            "label": "Sunset"
          },
          {
            "value": "ocean",
            "label": "Ocean"
          },
          {
            "value": "pastel",
            "label": "Pastel"
          },
          {
            "value": "neon",
            "label": "Neon"
          }
        ]
      },
      {
        "id": "poster-generator-choice-2",
        "label": "Style Desain",
        "type": "choice",
        "defaultValue": "modern",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "modern",
            "label": "Modern"
          },
          {
            "value": "minimalist",
            "label": "Minimalist"
          },
          {
            "value": "bold",
            "label": "Bold & Colorful"
          },
          {
            "value": "vintage",
            "label": "Vintage"
          },
          {
            "value": "professional",
            "label": "Professional"
          },
          {
            "value": "creative",
            "label": "Creative"
          },
          {
            "value": "elegant",
            "label": "Elegant"
          },
          {
            "value": "playful",
            "label": "Playful"
          }
        ]
      },
      {
        "id": "poster-generator-choice-3",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "3:4",
        "required": false,
        "options": [
          {
            "value": "3:4",
            "label": "3:4 (Portrait)"
          },
          {
            "value": "1:1",
            "label": "1:1 (Square)"
          },
          {
            "value": "4:3",
            "label": "4:3 (Landscape)"
          },
          {
            "value": "9:16",
            "label": "9:16 (Story)"
          },
          {
            "value": "16:9",
            "label": "16:9 (Wide)"
          },
          {
            "value": "4:5",
            "label": "4:5 (IG Post)"
          }
        ],
        "role": "ratio"
      },
      {
        "id": "poster-generator-choice-4",
        "label": "Jumlah Variasi",
        "type": "choice",
        "defaultValue": "3",
        "required": false,
        "options": [
          {
            "value": "3",
            "label": "3 Poster"
          },
          {
            "value": "6",
            "label": "6 Poster"
          },
          {
            "value": "9",
            "label": "9 Poster"
          }
        ]
      },
      {
        "id": "poster-generator-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Design a readable poster from the supplied subject, headline, details, colors and visual style. Include only supplied event or offer information.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "banner-generator",
    "label": "Banner Generator",
    "description": "Buat banner untuk platform dan ukuran pilihan.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "banner-bg-input",
        "label": "Upload foto background PNG, JPG, HEIC (Max 10MB)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "banner-headline-input",
        "label": "Teks Headline",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Big Sale 50% OFF!"
      },
      {
        "id": "banner-subheadline-input",
        "label": "Subheadline (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Limited time offer - Shop now!"
      },
      {
        "id": "banner-cta-input",
        "label": "CTA Button (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Shop Now, Learn More, Get Started"
      },
      {
        "id": "banner-type-options",
        "label": "Tipe Banner",
        "type": "choice",
        "defaultValue": "website",
        "required": false,
        "options": [
          {
            "value": "website",
            "label": "Website"
          },
          {
            "value": "social-media",
            "label": "Social Media"
          },
          {
            "value": "ads",
            "label": "Digital Ads"
          },
          {
            "value": "ecommerce",
            "label": "E-commerce"
          }
        ]
      },
      {
        "id": "banner-style-options",
        "label": "Style Banner",
        "type": "choice",
        "defaultValue": "modern-minimal",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "modern-minimal",
            "label": "Modern Minimal"
          },
          {
            "value": "bold-vibrant",
            "label": "Bold & Vibrant"
          },
          {
            "value": "elegant-luxury",
            "label": "Elegant Luxury"
          },
          {
            "value": "professional-corporate",
            "label": "Professional Corporate"
          },
          {
            "value": "playful-fun",
            "label": "Playful & Fun"
          },
          {
            "value": "dark-moody",
            "label": "Dark & Moody"
          },
          {
            "value": "gradient-modern",
            "label": "Gradient Modern"
          },
          {
            "value": "retro-vintage",
            "label": "Retro Vintage"
          }
        ]
      },
      {
        "id": "banner-color-options",
        "label": "Color Theme",
        "type": "choice",
        "defaultValue": "blue",
        "required": false,
        "options": [
          {
            "value": "blue",
            "label": "Blue"
          },
          {
            "value": "red",
            "label": "Red"
          },
          {
            "value": "green",
            "label": "Green"
          },
          {
            "value": "purple",
            "label": "Purple"
          },
          {
            "value": "orange",
            "label": "Orange"
          },
          {
            "value": "pink",
            "label": "Pink"
          }
        ]
      },
      {
        "id": "banner-size-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "options": [
          {
            "value": "16:9",
            "label": "16:9 Hero"
          },
          {
            "value": "3:1",
            "label": "3:1 Wide"
          },
          {
            "value": "1:1",
            "label": "1:1 Post"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          },
          {
            "value": "4:5",
            "label": "4:5 Portrait"
          }
        ],
        "role": "ratio"
      },
      {
        "id": "banner-count-options",
        "label": "Jumlah Variasi",
        "type": "choice",
        "defaultValue": "6",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "4",
            "label": "4 Banner"
          },
          {
            "value": "6",
            "label": "6 Banner"
          },
          {
            "value": "8",
            "label": "8 Banner"
          }
        ]
      },
      {
        "id": "banner-generator-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Design a commercial banner using the supplied brand, message, product and platform dimensions. Prioritize readable text and clear composition.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "thumbnail-generator",
    "label": "Thumbnail Pro",
    "description": "Buat thumbnail dengan judul, subjek, dan mood pilihan.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "tg-ref-photo",
        "label": "Upload Reference",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "tg-ref-custom-instructions",
        "label": "Custom Instructions (Optional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Tambahkan efek glow, gunakan warna biru dan merah, fokus pada produk di tengah, background blur, dsb.",
        "role": "prompt"
      },
      {
        "id": "tg-title-input",
        "label": "Thumbnail Title",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "e.g., HOW TO MAKE $10,000 ONLINE"
      },
      {
        "id": "tg-subtitle-input",
        "label": "Subtitle (Optional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "e.g., Step by Step Tutorial"
      },
      {
        "id": "tg-style-select",
        "label": "Thumbnail Style",
        "type": "select",
        "defaultValue": "tech",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "tech",
            "label": "Tech/Gaming (Neon, Futuristic)"
          },
          {
            "value": "business",
            "label": "Business/Finance (Professional)"
          },
          {
            "value": "vlog",
            "label": "Vlog/Lifestyle (Vibrant, Fun)"
          },
          {
            "value": "tutorial",
            "label": "Tutorial/Education (Clean, Clear)"
          },
          {
            "value": "dramatic",
            "label": "Dramatic/Clickbait (Bold, Eye-catching)"
          },
          {
            "value": "minimal",
            "label": "Minimal/Modern (Elegant, Simple)"
          }
        ]
      },
      {
        "id": "tg-expression-select",
        "label": "Expression/Vibe (Optional)",
        "type": "select",
        "defaultValue": "",
        "required": false,
        "options": [
          {
            "value": "",
            "label": "No Specific Expression"
          },
          {
            "value": "shocked",
            "label": "😲 Shocked/Surprised"
          },
          {
            "value": "excited",
            "label": "🤩 Excited/Amazed"
          },
          {
            "value": "serious",
            "label": "😐 Serious/Professional"
          },
          {
            "value": "happy",
            "label": "😄 Happy/Cheerful"
          },
          {
            "value": "dramatic",
            "label": "😱 Dramatic/Intense"
          },
          {
            "value": "mysterious",
            "label": "🤔 Mysterious/Intriguing"
          },
          {
            "value": "energetic",
            "label": "⚡ Energetic/Dynamic"
          },
          {
            "value": "calm",
            "label": "😌 Calm/Peaceful"
          }
        ]
      },
      {
        "id": "tg-category-select",
        "label": "Rasio aspek",
        "type": "select",
        "defaultValue": "16:9",
        "required": false,
        "options": [
          {
            "value": "16:9",
            "label": "YouTube (16:9)"
          },
          {
            "value": "1:1",
            "label": "Instagram Feed (1:1)"
          },
          {
            "value": "9:16",
            "label": "Instagram Story (9:16)"
          },
          {
            "value": "16:9",
            "label": "Facebook Post (16:9)"
          },
          {
            "value": "16:9",
            "label": "Twitter Card (16:9)"
          }
        ],
        "role": "ratio"
      },
      {
        "id": "tg-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Create a compelling thumbnail using the uploaded subject and supplied title, with the selected style, platform and composition.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "cover-photo-generator",
    "label": "Foto sampul IG & Tiktok",
    "description": "Buat foto sampul untuk konten Instagram atau TikTok.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "cpg-photo-input",
        "label": "Upload Your Photo",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "cpg-brand-name",
        "label": "Brand Name",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "e.g., JOHN DOE"
      },
      {
        "id": "cpg-tagline",
        "label": "Tagline (Optional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "e.g., Digital Marketing Expert"
      },
      {
        "id": "cpg-text-style",
        "label": "Text Style",
        "type": "select",
        "defaultValue": "bold",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "bold",
            "label": "Bold & Impact (Tegas, Strong)"
          },
          {
            "value": "elegant",
            "label": "Elegant & Luxury (Elegan, Mewah)"
          },
          {
            "value": "modern",
            "label": "Modern & Clean (Modern, Minimalis)"
          },
          {
            "value": "creative",
            "label": "Creative & Artistic (Kreatif, Unik)"
          },
          {
            "value": "tech",
            "label": "Tech & Futuristic (Teknologi, Futuristik)"
          },
          {
            "value": "casual",
            "label": "Casual & Friendly (Santai, Ramah)"
          }
        ]
      },
      {
        "id": "cpg-theme-preset",
        "label": "Theme Style",
        "type": "select",
        "defaultValue": "",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "",
            "label": "Select Preset Theme..."
          },
          {
            "value": "business",
            "label": "Business Professional (Formal, Corporate)"
          },
          {
            "value": "creative",
            "label": "Creative & Colorful (Kreatif, Warna-warni)"
          },
          {
            "value": "minimalist",
            "label": "Minimalist Clean (Simpel, Bersih)"
          },
          {
            "value": "dark",
            "label": "Dark & Moody (Gelap, Dramatic)"
          },
          {
            "value": "gradient",
            "label": "Gradient Modern (Gradien Trendy)"
          },
          {
            "value": "nature",
            "label": "Nature & Fresh (Alam, Segar)"
          }
        ]
      },
      {
        "id": "cpg-custom-theme",
        "label": "Or Custom Theme:",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "e.g., Golden sunset with warm tones",
        "role": "style"
      },
      {
        "id": "cpg-platform",
        "label": "Rasio aspek",
        "type": "select",
        "defaultValue": "9:16",
        "required": false,
        "options": [
          {
            "value": "9:16",
            "label": "TikTok Cover (9:16)"
          },
          {
            "value": "9:16",
            "label": "Instagram Story/Cover (9:16)"
          }
        ],
        "role": "ratio"
      },
      {
        "id": "cpg-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "cover-photo-generator-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Design a social-video cover image using the supplied title, uploaded subject and chosen visual style, keeping text readable.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "twibon",
    "label": "Twibon Frame",
    "description": "Susun frame twibon dengan desain dan foto pilihan.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "twibon-input",
        "label": "Upload Foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "twibon-description",
        "label": "Deskripsi Frame",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Frame untuk HUT RI ke-79 dengan bendera merah putih, warna patriotik, dan teks 'Dirgahayu Indonesia'",
        "role": "prompt"
      },
      {
        "id": "twibon-frame-input",
        "label": "Upload Frame Custom",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "twibon-zoom-slider",
        "label": "Zoom Foto 100%",
        "type": "range",
        "defaultValue": 100.0,
        "required": false,
        "min": 50.0,
        "max": 200.0,
        "step": 5.0
      },
      {
        "id": "twibon-choice-1",
        "label": "Kategori Frame",
        "type": "choice",
        "defaultValue": "independence",
        "required": false,
        "options": [
          {
            "value": "independence",
            "label": "Kemerdekaan"
          },
          {
            "value": "holiday",
            "label": "Hari Raya"
          },
          {
            "value": "birthday",
            "label": "Ulang Tahun"
          },
          {
            "value": "wedding",
            "label": "Pernikahan"
          },
          {
            "value": "graduation",
            "label": "Wisuda"
          },
          {
            "value": "campaign",
            "label": "Kampanye"
          },
          {
            "value": "corporate",
            "label": "Perusahaan"
          },
          {
            "value": "custom",
            "label": "Custom"
          }
        ]
      },
      {
        "id": "twibon-choice-2",
        "label": "Style Frame",
        "type": "choice",
        "defaultValue": "elegant",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "elegant",
            "label": "Elegant"
          },
          {
            "value": "modern",
            "label": "Modern"
          },
          {
            "value": "minimalist",
            "label": "Minimalist"
          },
          {
            "value": "colorful",
            "label": "Colorful"
          }
        ]
      },
      {
        "id": "twibon-choice-3",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "4:5",
            "label": "4:5"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "16:9",
            "label": "16:9"
          }
        ],
        "role": "ratio"
      },
      {
        "id": "twibon-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Design a twibbon-style frame around the uploaded photo using the supplied theme, colors and text. Keep the subject area unobstructed.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "bikin-carousel",
    "label": "Bikin Carousel",
    "description": "Buat slide carousel produk dengan narasi dan gaya konsisten.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "crsl-image-input",
        "label": "Klik atau seret foto",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "crsl-name-input",
        "label": "Nama & Deskripsi",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Nama Produk..."
      },
      {
        "id": "crsl-desc-input",
        "label": "Nama & Deskripsi",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Deskripsi singkat produk...",
        "role": "prompt"
      },
      {
        "id": "crsl-text-mode-toggle",
        "label": "Tambahkan Teks",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "crsl-kustom-script-input",
        "label": "Script Konten",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis jenis script kustom..."
      },
      {
        "id": "crsl-slides-options",
        "label": "Jumlah Slide",
        "type": "choice",
        "defaultValue": "5",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "7",
            "label": "7"
          }
        ]
      },
      {
        "id": "crsl-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "crsl-style-options",
        "label": "Tampilan",
        "type": "choice",
        "defaultValue": "Minimalis & Cerah",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Minimalis & Cerah",
            "label": "Minimalis"
          },
          {
            "value": "Elegan & Mewah",
            "label": "Elegan"
          },
          {
            "value": "Modern & Gelap",
            "label": "Modern"
          },
          {
            "value": "Warna-warni & Ceria",
            "label": "Ceria"
          }
        ]
      },
      {
        "id": "crsl-script-type-options",
        "label": "Script Konten",
        "type": "choice",
        "defaultValue": "showcase",
        "required": false,
        "options": [
          {
            "value": "showcase",
            "label": "Showcase"
          },
          {
            "value": "edukasi",
            "label": "Edukasi"
          },
          {
            "value": "storytelling",
            "label": "Story"
          },
          {
            "value": "kustom",
            "label": "Kustom"
          }
        ]
      },
      {
        "id": "crsl-font-options",
        "label": "Jenis Font",
        "type": "choice",
        "defaultValue": "'Poppins', sans-serif",
        "required": false,
        "options": [
          {
            "value": "'Poppins', sans-serif",
            "label": "Modern"
          },
          {
            "value": "'Georgia', serif",
            "label": "Elegan"
          },
          {
            "value": "'Comic Sans MS', cursive",
            "label": "Santai"
          }
        ]
      },
      {
        "id": "crsl-font-color-options",
        "label": "Warna Font",
        "type": "choice",
        "defaultValue": "auto",
        "required": false,
        "options": [
          {
            "value": "auto",
            "label": "Auto"
          },
          {
            "value": "#FFFFFF",
            "label": "Putih"
          },
          {
            "value": "#000000",
            "label": "Hitam"
          },
          {
            "value": "#FFD700",
            "label": "Emas"
          }
        ]
      }
    ],
    "promptIntent": "Create a coherent product-carousel slide using the uploaded product and selected slide plan, style, typography and text. Maintain consistency between numbered slides.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "sketsa-gambar",
    "label": "Sketsa Gambar",
    "description": "Ubah sketsa menjadi ilustrasi atau gambar yang lebih lengkap.",
    "iconId": "palette",
    "group": "branding-design",
    "kind": "image",
    "fields": [
      {
        "id": "sti-image-input",
        "label": "Klik atau seret sketsa",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "sti-custom-purpose-input",
        "label": "Tujuan Gambar",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis tujuan kustom Anda di sini..."
      },
      {
        "id": "sti-prompt-input",
        "label": "Instruksi",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Klik tombol magic untuk mengisi otomatis...",
        "role": "prompt"
      },
      {
        "id": "sti-purpose-options",
        "label": "Tujuan Gambar",
        "type": "choice",
        "defaultValue": "Logo",
        "required": false,
        "options": [
          {
            "value": "Logo",
            "label": "Logo"
          },
          {
            "value": "Banner",
            "label": "Banner"
          },
          {
            "value": "Foto Produk",
            "label": "Produk"
          },
          {
            "value": "3D Render",
            "label": "3D Render"
          },
          {
            "value": "Gaya Kartun",
            "label": "Kartun"
          },
          {
            "value": "Foto Realistis",
            "label": "Realistis"
          },
          {
            "value": "Kustom",
            "label": "Kustom"
          }
        ]
      },
      {
        "id": "sti-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          },
          {
            "value": "4:5",
            "label": "4:5"
          }
        ]
      },
      {
        "id": "sti-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      }
    ],
    "promptIntent": "Develop the uploaded sketch into a finished image using the selected style, colors and detail level while preserving its intended composition.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "desain-rumah",
    "label": "Desain Rumah & Interior",
    "description": "Pratinjau desain rumah atau interior dari foto dan brief.",
    "iconId": "home",
    "group": "home-interior",
    "kind": "image",
    "fields": [
      {
        "id": "dr-interior-room-input",
        "label": "Klik atau seret foto",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "dr-interior-furniture-prompt",
        "label": "Tambah Furnitur AI",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "sofa modern..."
      },
      {
        "id": "dr-interior-manual-furniture-input",
        "label": "Tambah",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "multiple": true,
        "role": "image"
      },
      {
        "id": "dr-interior-instruction-input",
        "label": "Instruksi & Rasio",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Letakkan sofa di depan jendela...",
        "role": "ratio"
      },
      {
        "id": "dr-eksterior-house-input",
        "label": "Klik atau seret foto",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "dr-eksterior-kustom-input",
        "label": "Pilih Gaya Renovasi",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Tulis gaya kustom Anda..."
      },
      {
        "id": "dr-eksterior-instruction-input",
        "label": "Instruksi & Rasio",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Ganti cat menjadi putih, dengan aksen kayu...",
        "role": "ratio"
      },
      {
        "id": "desain-rumah-choice-1",
        "label": "Mode studio",
        "type": "choice",
        "defaultValue": "desain-rumah",
        "required": false,
        "options": [
          {
            "value": "desain-rumah",
            "label": "Rumah / Eksterior"
          },
          {
            "value": "desain-kamar",
            "label": "Desain Kamar"
          },
          {
            "value": "timelapse-renovasi",
            "label": "Timelapse Renovasi"
          }
        ]
      },
      {
        "id": "dr-interior-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "dr-eksterior-style-options",
        "label": "Pilih Gaya Renovasi",
        "type": "choice",
        "defaultValue": "Ganti Warna Cat",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "Ganti Warna Cat",
            "label": "Ganti Cat"
          },
          {
            "value": "Modernisasi Fasad",
            "label": "Modern"
          },
          {
            "value": "Tambah Taman Depan",
            "label": "Taman"
          },
          {
            "value": "Ganti Pagar",
            "label": "Pagar"
          },
          {
            "value": "Gaya Minimalis",
            "label": "Minimalis"
          },
          {
            "value": "Gaya Tropis",
            "label": "Tropis"
          },
          {
            "value": "Kustom",
            "label": "Kustom"
          }
        ]
      },
      {
        "id": "dr-eksterior-ratio-options",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "desain-rumah-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      },
      {
        "id": "desain-rumah-result-count",
        "label": "Jumlah hasil",
        "type": "choice",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "10",
            "label": "10"
          }
        ],
        "defaultValue": "4",
        "required": false,
        "role": "count"
      }
    ],
    "promptIntent": "Create an architectural or interior-design visualization from the uploaded space or brief, using the selected style, materials and room function.",
    "isNew": false,
    "hidden": false,
    "variants": [
      {
        "id": "desain-kamar",
        "label": "Desain Kamar",
        "description": "Coba desain kamar dengan gaya dan fungsi pilihan.",
        "iconId": "home",
        "group": "home-interior",
        "kind": "image",
        "fields": [
          {
            "id": "room-upload",
            "label": "🏠 Klik untuk upload foto kamar Format: JPG, PNG, HEIC",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "room-custom-theme-input",
            "label": "Tema Desain",
            "type": "textarea",
            "defaultValue": "",
            "required": false,
            "placeholder": "Deskripsikan tema desain custom Anda... (contoh: futuristic tech-inspired dengan LED lighting dan metallic surfaces)",
            "role": "prompt"
          },
          {
            "id": "room-reference-upload",
            "label": "Upload referensi desain (opsional)",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "desain-kamar-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "desain-kamar",
            "required": false,
            "options": [
              {
                "value": "desain-rumah",
                "label": "Rumah / Eksterior"
              },
              {
                "value": "desain-kamar",
                "label": "Desain Kamar"
              },
              {
                "value": "timelapse-renovasi",
                "label": "Timelapse Renovasi"
              }
            ]
          },
          {
            "id": "room-theme-options",
            "label": "Tema Desain",
            "type": "choice",
            "defaultValue": "modern-minimalist",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "modern-minimalist",
                "label": "Modern Minimalist"
              },
              {
                "value": "scandinavian",
                "label": "Scandinavian"
              },
              {
                "value": "industrial",
                "label": "Industrial"
              },
              {
                "value": "bohemian",
                "label": "Bohemian"
              },
              {
                "value": "mid-century-modern",
                "label": "Mid-Century Modern"
              },
              {
                "value": "contemporary",
                "label": "Contemporary"
              },
              {
                "value": "traditional",
                "label": "Traditional"
              },
              {
                "value": "rustic",
                "label": "Rustic"
              },
              {
                "value": "coastal",
                "label": "Coastal"
              },
              {
                "value": "farmhouse",
                "label": "Farmhouse"
              },
              {
                "value": "art-deco",
                "label": "Art Deco"
              },
              {
                "value": "japanese-zen",
                "label": "Japanese Zen"
              },
              {
                "value": "hollywood-glam",
                "label": "Hollywood Glam"
              },
              {
                "value": "mediterranean",
                "label": "Mediterranean"
              },
              {
                "value": "tropical",
                "label": "Tropical"
              },
              {
                "value": "custom",
                "label": "Custom Theme"
              }
            ]
          },
          {
            "id": "room-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "1:1",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "1:1",
                "label": "1:1"
              },
              {
                "value": "16:9",
                "label": "16:9"
              },
              {
                "value": "3:4",
                "label": "3:4"
              },
              {
                "value": "9:16",
                "label": "9:16"
              }
            ]
          },
          {
            "id": "room-count-selection-grid",
            "label": "Jumlah Generate",
            "type": "choice",
            "defaultValue": "4",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "1",
                "label": "1"
              },
              {
                "value": "2",
                "label": "2"
              },
              {
                "value": "3",
                "label": "3"
              },
              {
                "value": "4",
                "label": "4"
              },
              {
                "value": "5",
                "label": "5"
              },
              {
                "value": "6",
                "label": "6"
              },
              {
                "value": "7",
                "label": "7"
              },
              {
                "value": "8",
                "label": "8"
              },
              {
                "value": "9",
                "label": "9"
              },
              {
                "value": "10",
                "label": "10"
              }
            ]
          }
        ],
        "promptIntent": "Redesign the supplied room image using the selected layout, furniture, palette and style while retaining plausible room proportions.",
        "isNew": false,
        "hidden": true
      },
      {
        "id": "timelapse-renovasi",
        "label": "Timelapse Renovasi",
        "description": "Buat urutan frame renovasi dari kondisi awal ke hasil akhir.",
        "iconId": "home",
        "group": "home-interior",
        "kind": "image",
        "fields": [
          {
            "id": "timelapse-before-input",
            "label": "Foto Awal / Before *",
            "type": "file",
            "defaultValue": "",
            "required": true,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "timelapse-after-input",
            "label": "Referensi Akhir (Opsional)",
            "type": "file",
            "defaultValue": "",
            "required": false,
            "accept": "image/png,image/jpeg,image/webp",
            "role": "image"
          },
          {
            "id": "timelapse-renovasi-choice-1",
            "label": "Mode studio",
            "type": "choice",
            "defaultValue": "timelapse-renovasi",
            "required": false,
            "options": [
              {
                "value": "desain-rumah",
                "label": "Rumah / Eksterior"
              },
              {
                "value": "desain-kamar",
                "label": "Desain Kamar"
              },
              {
                "value": "timelapse-renovasi",
                "label": "Timelapse Renovasi"
              }
            ]
          },
          {
            "id": "timelapse-theme-options",
            "label": "Tema Renovasi (20 tema)",
            "type": "choice",
            "defaultValue": "modern-minimalis",
            "required": false,
            "role": "style",
            "options": [
              {
                "value": "modern-minimalis",
                "label": "Modern Minimalis"
              },
              {
                "value": "scandinavian",
                "label": "Scandinavian"
              },
              {
                "value": "industrial-loft",
                "label": "Industrial Loft"
              },
              {
                "value": "tropis-modern",
                "label": "Tropis Modern"
              },
              {
                "value": "japanese-zen",
                "label": "Japanese Zen"
              },
              {
                "value": "mediterranean",
                "label": "Mediterranean"
              },
              {
                "value": "art-deco-mewah",
                "label": "Art Deco Mewah"
              },
              {
                "value": "rustic-farmhouse",
                "label": "Rustic Farmhouse"
              },
              {
                "value": "urban-kontemporer",
                "label": "Urban Kontemporer"
              },
              {
                "value": "bohemian",
                "label": "Bohemian"
              },
              {
                "value": "classic-elegan",
                "label": "Classic Elegan"
              },
              {
                "value": "smart-futuristik",
                "label": "Smart Futuristik"
              },
              {
                "value": "eco-green",
                "label": "Eco Green"
              },
              {
                "value": "coastal-beach",
                "label": "Coastal Beach"
              },
              {
                "value": "retro-vintage",
                "label": "Retro Vintage"
              },
              {
                "value": "luxury-mansion",
                "label": "Luxury Mansion"
              },
              {
                "value": "container-house",
                "label": "Container House"
              },
              {
                "value": "ruko-modern",
                "label": "Ruko Modern"
              },
              {
                "value": "cafe-resto",
                "label": "Cafe & Resto"
              },
              {
                "value": "heritage-restoration",
                "label": "Heritage Restore"
              }
            ]
          },
          {
            "id": "timelapse-frame-count",
            "label": "Jumlah Frame Timelapse",
            "type": "choice",
            "defaultValue": "2",
            "required": false,
            "role": "count",
            "options": [
              {
                "value": "2",
                "label": "2 frame"
              },
              {
                "value": "3",
                "label": "3 frame"
              },
              {
                "value": "4",
                "label": "4 frame"
              },
              {
                "value": "5",
                "label": "5 frame"
              },
              {
                "value": "6",
                "label": "6 frame"
              }
            ]
          },
          {
            "id": "timelapse-ratio-options",
            "label": "Rasio aspek",
            "type": "choice",
            "defaultValue": "9:16",
            "required": false,
            "role": "ratio",
            "options": [
              {
                "value": "16:9",
                "label": "16:9 Landscape"
              },
              {
                "value": "9:16",
                "label": "9:16 Vertikal"
              },
              {
                "value": "3:4",
                "label": "3:4 Portrait"
              },
              {
                "value": "1:1",
                "label": "1:1 Square"
              }
            ]
          },
          {
            "id": "timelapse-renovasi-brief",
            "label": "Instruksi tambahan",
            "type": "textarea",
            "required": false,
            "defaultValue": "",
            "role": "prompt",
            "placeholder": "Tambahkan detail yang ingin diterapkan"
          }
        ],
        "promptIntent": "Create a numbered renovation-progress image sequence from the supplied space and target design, keeping the camera viewpoint consistent.",
        "isNew": false,
        "hidden": true
      }
    ]
  },
  {
    "id": "deskripsi-produk",
    "label": "Deskripsi Produk SEO",
    "description": "Tulis deskripsi produk SEO dari foto dan informasi produk.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "desc-product-name",
        "label": "Nama/Judul Produk *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Serum Vitamin C Premium 30ml"
      },
      {
        "id": "desc-product-link",
        "label": "Link Produk (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false
      },
      {
        "id": "desc-product-category",
        "label": "Kategori Produk",
        "type": "select",
        "defaultValue": "",
        "required": false,
        "options": [
          {
            "value": "",
            "label": "Pilih Kategori..."
          },
          {
            "value": "fashion",
            "label": "Fashion & Pakaian"
          },
          {
            "value": "kecantikan",
            "label": "Kecantikan & Perawatan"
          },
          {
            "value": "elektronik",
            "label": "Elektronik & Gadget"
          },
          {
            "value": "rumah-tangga",
            "label": "Rumah Tangga & Dekorasi"
          },
          {
            "value": "makanan",
            "label": "Makanan & Minuman"
          },
          {
            "value": "olahraga",
            "label": "Olahraga & Outdoor"
          },
          {
            "value": "hobi",
            "label": "Hobi & Koleksi"
          },
          {
            "value": "bayi",
            "label": "Ibu & Bayi"
          },
          {
            "value": "kesehatan",
            "label": "Kesehatan"
          },
          {
            "value": "otomotif",
            "label": "Otomotif"
          }
        ]
      },
      {
        "id": "desc-product-features",
        "label": "Fitur/Keunggulan Produk",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Mengandung vitamin C murni 15%, aman untuk kulit sensitif, teruji BPOM",
        "role": "prompt"
      },
      {
        "id": "deskripsi-produk-choice-1",
        "label": "Platform Target",
        "type": "choice",
        "defaultValue": "shopee",
        "required": false,
        "options": [
          {
            "value": "shopee",
            "label": "Shopee"
          },
          {
            "value": "tiktok",
            "label": "TikTok Shop"
          }
        ]
      },
      {
        "id": "deskripsi-produk-choice-2",
        "label": "Panjang Deskripsi",
        "type": "choice",
        "defaultValue": "short",
        "required": false,
        "options": [
          {
            "value": "short",
            "label": "Pendek"
          },
          {
            "value": "long",
            "label": "Panjang"
          }
        ]
      }
    ],
    "promptIntent": "Write an accurate product description using only supplied attributes. Match the selected marketplace, language, tone and keyword focus; do not invent specifications.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "ide-konten-tiktok",
    "label": "Ide Konten TikTok",
    "description": "Susun ide konten TikTok dari produk dan target audiens.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "tiktok-category",
        "label": "Kategori Produk *",
        "type": "select",
        "defaultValue": "",
        "required": false,
        "options": [
          {
            "value": "",
            "label": "Pilih Kategori..."
          },
          {
            "value": "skincare",
            "label": "Skincare & Kecantikan"
          },
          {
            "value": "fashion",
            "label": "Fashion & OOTD"
          },
          {
            "value": "gadget",
            "label": "Gadget & Elektronik"
          },
          {
            "value": "makanan",
            "label": "Makanan & Minuman"
          },
          {
            "value": "lifestyle",
            "label": "Lifestyle & Daily Vlog"
          },
          {
            "value": "home",
            "label": "Home & Living"
          },
          {
            "value": "fitness",
            "label": "Fitness & Kesehatan"
          },
          {
            "value": "edukasi",
            "label": "Tips & Edukasi"
          }
        ]
      },
      {
        "id": "tiktok-product",
        "label": "Nama/Jenis Produk",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Lip tint Korea, Smartwatch, Dress casual"
      },
      {
        "id": "tiktok-audience",
        "label": "Target Audience",
        "type": "select",
        "defaultValue": "gen-z",
        "required": false,
        "options": [
          {
            "value": "gen-z",
            "label": "Gen Z (18-25 tahun)"
          },
          {
            "value": "milenial",
            "label": "Milenial (26-40 tahun)"
          },
          {
            "value": "ibu-rumah-tangga",
            "label": "Ibu Rumah Tangga"
          },
          {
            "value": "pekerja",
            "label": "Pekerja Kantoran"
          },
          {
            "value": "pelajar",
            "label": "Pelajar/Mahasiswa"
          },
          {
            "value": "umum",
            "label": "Umum"
          }
        ]
      },
      {
        "id": "ide-konten-tiktok-choice-1",
        "label": "Tipe Konten",
        "type": "choice",
        "defaultValue": "review",
        "required": false,
        "options": [
          {
            "value": "review",
            "label": "Review"
          },
          {
            "value": "tutorial",
            "label": "Tutorial"
          },
          {
            "value": "unboxing",
            "label": "Unboxing"
          },
          {
            "value": "comparison",
            "label": "Perbandingan"
          }
        ]
      },
      {
        "id": "ide-konten-tiktok-choice-2",
        "label": "Durasi Video Target",
        "type": "choice",
        "defaultValue": "short",
        "required": false,
        "options": [
          {
            "value": "short",
            "label": "15-30s"
          },
          {
            "value": "medium",
            "label": "30-60s"
          },
          {
            "value": "long",
            "label": "60s+"
          }
        ]
      },
      {
        "id": "ide-konten-tiktok-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Develop practical TikTok content ideas from the supplied product and audience, including hooks, scene suggestions and calls to action without inventing live trends.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "script-story-iklan",
    "label": "Script Story Iklan",
    "description": "Buat script iklan dengan hook, adegan, dan ajakan tindakan.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "story-target-audience",
        "label": "Target Audience *",
        "type": "select",
        "defaultValue": "",
        "required": false,
        "options": [
          {
            "value": "",
            "label": "Pilih Target Audience..."
          },
          {
            "value": "ibu-rumah-tangga",
            "label": "Ibu Rumah Tangga"
          },
          {
            "value": "mahasiswa",
            "label": "Mahasiswa"
          },
          {
            "value": "pekerja-kantoran",
            "label": "Pekerja Kantoran"
          },
          {
            "value": "pebisnis",
            "label": "Pebisnis/Entrepreneur"
          },
          {
            "value": "remaja",
            "label": "Remaja (15-20 tahun)"
          },
          {
            "value": "dewasa-muda",
            "label": "Dewasa Muda (20-30 tahun)"
          },
          {
            "value": "orang-tua",
            "label": "Orang Tua"
          }
        ]
      },
      {
        "id": "story-product-name",
        "label": "Nama Produk *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Serum Anti-Aging Premium"
      },
      {
        "id": "story-problem",
        "label": "Masalah yang Dipecahkan *",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kulit kusam, keriput, tidak kencang",
        "role": "prompt"
      },
      {
        "id": "story-benefits",
        "label": "Manfaat/Solusi Produk",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Mencerahkan, mengencangkan, mengurangi kerutan dalam 2 minggu",
        "role": "prompt"
      },
      {
        "id": "story-affiliate-link",
        "label": "Sertakan Link Affiliate?",
        "type": "text",
        "defaultValue": "",
        "required": false
      },
      {
        "id": "script-story-iklan-choice-1",
        "label": "Tone/Gaya Bahasa",
        "type": "choice",
        "defaultValue": "friendly",
        "required": false,
        "options": [
          {
            "value": "friendly",
            "label": "Ramah"
          },
          {
            "value": "professional",
            "label": "Profesional"
          },
          {
            "value": "casual",
            "label": "Santai"
          },
          {
            "value": "enthusiastic",
            "label": "Antusias"
          }
        ]
      },
      {
        "id": "script-story-iklan-choice-2",
        "label": "Panjang Script",
        "type": "choice",
        "defaultValue": "short",
        "required": false,
        "options": [
          {
            "value": "short",
            "label": "Pendek (30-60s)"
          },
          {
            "value": "long",
            "label": "Panjang (60-120s)"
          }
        ]
      }
    ],
    "promptIntent": "Write an advertisement script matching the selected duration, style and audience. Base claims on the supplied product information and organize scenes clearly.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "caption-generator",
    "label": "AI Caption Generator",
    "description": "Tulis caption dan hashtag dari foto serta konteks konten.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "caption-image-upload",
        "label": "Upload Foto Produk",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "caption-platform-selection",
        "label": "Platform Target",
        "type": "choice",
        "defaultValue": "instagram",
        "required": false,
        "options": [
          {
            "value": "instagram",
            "label": "Instagram"
          },
          {
            "value": "tiktok",
            "label": "TikTok"
          },
          {
            "value": "facebook",
            "label": "Facebook"
          }
        ]
      },
      {
        "id": "caption-tone-selection",
        "label": "Caption Tone",
        "type": "choice",
        "defaultValue": "casual",
        "required": false,
        "options": [
          {
            "value": "casual",
            "label": "Casual"
          },
          {
            "value": "professional",
            "label": "Professional"
          },
          {
            "value": "storytelling",
            "label": "Storytelling"
          }
        ]
      },
      {
        "id": "caption-count-selection",
        "label": "Jumlah Variasi",
        "type": "choice",
        "defaultValue": "5",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "5",
            "label": "5 Caption"
          },
          {
            "value": "7",
            "label": "7 Caption"
          },
          {
            "value": "10",
            "label": "10 Caption"
          }
        ]
      },
      {
        "id": "caption-generator-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Write social-media captions and relevant hashtags from the uploaded image and supplied context, matching platform, language and tone.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "konten-marketing",
    "label": "Konten Marketing",
    "description": "Buat materi marketing sesuai format, produk, dan audiens.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "km-produk",
        "label": "Nama Produk/Layanan *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kopi Premium, Sepatu Running"
      },
      {
        "id": "km-promosi",
        "label": "Jenis Promosi",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Diskon 50%, Beli 1 Gratis 1, Flash Sale"
      },
      {
        "id": "km-platform-ig",
        "label": "Platform Target",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "km-platform-fb",
        "label": "Instagram",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "km-platform-email",
        "label": "Facebook",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "km-platform-ads",
        "label": "Email",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "km-info",
        "label": "Informasi Tambahan",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "USP, keunggulan produk, target audience, periode promo, dll",
        "role": "prompt"
      }
    ],
    "promptIntent": "Write the selected marketing asset from the supplied product brief, audience, tone and goals. Keep claims supported by the user's information.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "content-calendar",
    "label": "Content Calendar Planner",
    "description": "Susun kalender konten sesuai platform dan periode pilihan.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "calendar-brand-name",
        "label": "Brand/Product Name *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: FitPro Supplements"
      },
      {
        "id": "calendar-niche",
        "label": "Niche/Industry *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Health & Fitness, Beauty, Tech"
      },
      {
        "id": "calendar-description",
        "label": "Short Description",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Apa yang dijual? Target audience siapa?",
        "role": "prompt"
      },
      {
        "id": "calendar-platform-options",
        "label": "Target Platforms *",
        "type": "choice",
        "defaultValue": "Instagram",
        "required": false,
        "options": [
          {
            "value": "Instagram",
            "label": "Instagram"
          },
          {
            "value": "TikTok",
            "label": "TikTok"
          },
          {
            "value": "YouTube",
            "label": "YouTube"
          },
          {
            "value": "Facebook",
            "label": "Facebook"
          },
          {
            "value": "LinkedIn",
            "label": "LinkedIn"
          },
          {
            "value": "Twitter",
            "label": "Twitter"
          }
        ]
      },
      {
        "id": "calendar-frequency-options",
        "label": "Posting Frequency *",
        "type": "choice",
        "defaultValue": "3x-week",
        "required": false,
        "options": [
          {
            "value": "daily",
            "label": "📅 Daily (30 posts)"
          },
          {
            "value": "5x-week",
            "label": "🔥 5x/Week (~22 posts)"
          },
          {
            "value": "3x-week",
            "label": "⚡ 3x/Week (~13 posts)"
          },
          {
            "value": "2x-week",
            "label": "💡 2x/Week (~9 posts)"
          }
        ]
      },
      {
        "id": "calendar-content-types",
        "label": "Content Mix",
        "type": "choice",
        "defaultValue": "Promotional",
        "required": false,
        "options": [
          {
            "value": "Educational",
            "label": "Educational"
          },
          {
            "value": "Entertainment",
            "label": "Entertainment"
          },
          {
            "value": "Promotional",
            "label": "Promotional"
          },
          {
            "value": "Behind-the-Scenes",
            "label": "BTS"
          },
          {
            "value": "User-Generated",
            "label": "UGC"
          },
          {
            "value": "Testimonials",
            "label": "Testimonials"
          }
        ]
      },
      {
        "id": "calendar-tone-options",
        "label": "Brand Tone *",
        "type": "choice",
        "defaultValue": "Casual & Friendly",
        "required": false,
        "options": [
          {
            "value": "Professional",
            "label": "👔 Professional"
          },
          {
            "value": "Casual & Friendly",
            "label": "😊 Casual"
          },
          {
            "value": "Fun & Playful",
            "label": "🎉 Playful"
          },
          {
            "value": "Inspirational",
            "label": "✨ Inspirational"
          },
          {
            "value": "Educational",
            "label": "📚 Educational"
          },
          {
            "value": "Motivational",
            "label": "💪 Motivational"
          }
        ]
      },
      {
        "id": "content-calendar-choice-5",
        "label": "Brand Tone *",
        "type": "choice",
        "defaultValue": "calendar",
        "required": false,
        "options": [
          {
            "value": "calendar",
            "label": "Calendar"
          },
          {
            "value": "list",
            "label": "List"
          }
        ]
      },
      {
        "id": "content-calendar-choice-6",
        "label": "Content Schedule (0 Posts)",
        "type": "choice",
        "defaultValue": "all",
        "required": false,
        "options": [
          {
            "value": "all",
            "label": "All"
          }
        ]
      }
    ],
    "promptIntent": "Build a practical content calendar for the supplied brand, selected platforms, schedule and goals. Include dates, topic, format, hook and suggested call to action.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "ab-testing",
    "label": "A/B Testing AI",
    "description": "Buat dan bandingkan alternatif kreatif A/B dari brief Anda.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "abtest-variant-a",
        "label": "Variant A * Click to upload",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "abtest-variant-b",
        "label": "Variant B * Click to upload",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "abtest-variant-c",
        "label": "Variant C (Optional) Click to upload",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "abtest-variant-d",
        "label": "Variant D (Optional) Click to upload",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "abtest-age",
        "label": "Age Range",
        "type": "select",
        "defaultValue": "18-24",
        "required": false,
        "options": [
          {
            "value": "13-17",
            "label": "13-17 (Gen Z Muda)"
          },
          {
            "value": "18-24",
            "label": "18-24 (Gen Z)"
          },
          {
            "value": "25-34",
            "label": "25-34 (Millennial)"
          },
          {
            "value": "35-44",
            "label": "35-44 (Millennial/Gen X)"
          },
          {
            "value": "45+",
            "label": "45+ (Gen X/Boomer)"
          }
        ]
      },
      {
        "id": "abtest-platform-options",
        "label": "Target Platform *",
        "type": "choice",
        "defaultValue": "Instagram",
        "required": false,
        "options": [
          {
            "value": "Instagram",
            "label": "Instagram"
          },
          {
            "value": "TikTok",
            "label": "TikTok"
          },
          {
            "value": "YouTube",
            "label": "YouTube"
          },
          {
            "value": "Facebook",
            "label": "Facebook"
          },
          {
            "value": "Twitter",
            "label": "Twitter"
          },
          {
            "value": "LinkedIn",
            "label": "LinkedIn"
          }
        ]
      },
      {
        "id": "abtest-goal-options",
        "label": "Content Goal *",
        "type": "choice",
        "defaultValue": "Engagement",
        "required": false,
        "options": [
          {
            "value": "Engagement",
            "label": "💬 Engagement"
          },
          {
            "value": "Reach",
            "label": "📢 Reach/Viral"
          },
          {
            "value": "Click-Through",
            "label": "👆 Click-Through"
          },
          {
            "value": "Conversion",
            "label": "💰 Conversion"
          },
          {
            "value": "Brand-Awareness",
            "label": "🎯 Awareness"
          },
          {
            "value": "Retention",
            "label": "🔄 Retention"
          }
        ]
      },
      {
        "id": "abtest-gender-options",
        "label": "Gender Focus",
        "type": "choice",
        "defaultValue": "All",
        "required": false,
        "options": [
          {
            "value": "All",
            "label": "All"
          },
          {
            "value": "Male",
            "label": "Male"
          },
          {
            "value": "Female",
            "label": "Female"
          }
        ]
      },
      {
        "id": "abtest-criteria-options",
        "label": "Analysis Focus",
        "type": "choice",
        "defaultValue": "Call-to-Action",
        "required": false,
        "options": [
          {
            "value": "Visual-Appeal",
            "label": "Visual Appeal"
          },
          {
            "value": "Color-Psychology",
            "label": "Color Psychology"
          },
          {
            "value": "Composition",
            "label": "Composition"
          },
          {
            "value": "Attention-Grabbing",
            "label": "Attention Grab"
          },
          {
            "value": "Emotional-Impact",
            "label": "Emotional Impact"
          },
          {
            "value": "Call-to-Action",
            "label": "CTA Clarity"
          },
          {
            "value": "Text-Readability",
            "label": "Text Readability"
          },
          {
            "value": "Brand-Consistency",
            "label": "Brand Fit"
          }
        ]
      },
      {
        "id": "ab-testing-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create clearly labelled A and B creative variants for the supplied brief and explain a measurable test plan. Do not fabricate conversion results.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "product-comparison",
    "label": "Product Comparison",
    "description": "Susun perbandingan visual dua atau tiga produk.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "image",
    "fields": [
      {
        "id": "comparison-product-1-upload",
        "label": "Produk 1 (Required)",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "comparison-product-2-upload",
        "label": "Produk 2 (Required)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "comparison-product-3-upload",
        "label": "Produk 3 (Optional)",
        "type": "file",
        "defaultValue": "",
        "required": false,
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "comparison-show-pros-cons",
        "label": "Tampilkan",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "comparison-show-features",
        "label": "Pros & Cons",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "comparison-show-winner",
        "label": "Feature Highlights",
        "type": "choice",
        "defaultValue": "yes",
        "required": false,
        "options": [
          {
            "value": "no",
            "label": "Tidak"
          },
          {
            "value": "yes",
            "label": "Ya"
          }
        ]
      },
      {
        "id": "comparison-style-selection",
        "label": "Comparison Style",
        "type": "choice",
        "defaultValue": "side-by-side",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "side-by-side",
            "label": "Side-by-Side"
          },
          {
            "value": "grid",
            "label": "Grid Layout"
          }
        ]
      },
      {
        "id": "comparison-aspect-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "16:9",
            "label": "16:9"
          },
          {
            "value": "1:1",
            "label": "1:1"
          },
          {
            "value": "9:16",
            "label": "9:16"
          }
        ]
      },
      {
        "id": "comparison-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "product-comparison-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create a clear comparison graphic from the uploaded product references and supplied attributes. Include only provided prices, ratings and specifications.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "roi-calculator",
    "label": "ROI Calculator AI",
    "description": "Hitung skenario ROI dari biaya dan target yang diberikan.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "roi-price-per-unit",
        "label": "Price per Unit (Rp)",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "100000",
        "min": 0.0,
        "step": 1000.0
      },
      {
        "id": "roi-expected-sales",
        "label": "Expected Sales/Month",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "50",
        "min": 0.0,
        "step": 1.0
      },
      {
        "id": "roi-commission",
        "label": "Commission/Profit Margin (%)",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "20",
        "min": 0.0,
        "max": 100.0,
        "step": 0.1
      },
      {
        "id": "roi-marketing-cost",
        "label": "Marketing/Ads Budget (Rp)",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "500000",
        "min": 0.0,
        "step": 10000.0
      },
      {
        "id": "roi-content-cost",
        "label": "Content Creation (Rp)",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "200000",
        "min": 0.0,
        "step": 10000.0
      },
      {
        "id": "roi-other-cost",
        "label": "Other Costs (Rp)",
        "type": "number",
        "defaultValue": 0.0,
        "required": false,
        "placeholder": "100000",
        "min": 0.0,
        "step": 10000.0
      },
      {
        "id": "roi-campaign-type-options",
        "label": "Campaign Type *",
        "type": "choice",
        "defaultValue": "Affiliate Marketing",
        "required": false,
        "options": [
          {
            "value": "Affiliate Marketing",
            "label": "🔗 Affiliate"
          },
          {
            "value": "Dropshipping",
            "label": "📦 Dropship"
          },
          {
            "value": "Digital Products",
            "label": "💻 Digital"
          },
          {
            "value": "Services",
            "label": "🛠️ Services"
          },
          {
            "value": "E-commerce",
            "label": "🛒 E-commerce"
          },
          {
            "value": "Content Monetization",
            "label": "📹 Content"
          }
        ]
      },
      {
        "id": "roi-timeframe-options",
        "label": "Projection Period",
        "type": "choice",
        "defaultValue": "3",
        "required": false,
        "options": [
          {
            "value": "3",
            "label": "3 Months"
          },
          {
            "value": "6",
            "label": "6 Months"
          },
          {
            "value": "12",
            "label": "12 Months"
          }
        ]
      },
      {
        "id": "roi-growth-options",
        "label": "Growth Scenario",
        "type": "choice",
        "defaultValue": "Moderate",
        "required": false,
        "options": [
          {
            "value": "Conservative",
            "label": "🐌 Conservative"
          },
          {
            "value": "Moderate",
            "label": "📈 Moderate"
          },
          {
            "value": "Aggressive",
            "label": "🚀 Aggressive"
          }
        ]
      },
      {
        "id": "roi-calculator-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Calculate return-on-investment scenarios from the supplied numbers, show formulas and assumptions, and distinguish estimates from observed results.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "riset-pasar",
    "label": "Riset Pasar & Ide",
    "description": "Susun analisis pasar dan ide dari informasi yang tersedia.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "rm-bisnis",
        "label": "Jenis Bisnis Saat Ini *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kafe, Toko Online Fashion, Salon"
      },
      {
        "id": "rm-tujuan",
        "label": "Tujuan Riset",
        "type": "select",
        "defaultValue": "produk-baru",
        "required": false,
        "options": [
          {
            "value": "produk-baru",
            "label": "Ide Produk/Menu Baru"
          },
          {
            "value": "ekspansi",
            "label": "Peluang Ekspansi Bisnis"
          },
          {
            "value": "tren",
            "label": "Analisis Tren Pasar"
          },
          {
            "value": "kompetitor",
            "label": "Analisis Kompetitor"
          }
        ]
      },
      {
        "id": "rm-target",
        "label": "Lokasi/Target Market",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Jakarta, Indonesia, Gen Z"
      },
      {
        "id": "rm-preferensi",
        "label": "Preferensi Khusus (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Ramah lingkungan, budget terbatas, viral di media sosial, dll",
        "role": "prompt"
      }
    ],
    "promptIntent": "Analyze the supplied business brief and market context, separate supplied facts from assumptions, and propose research questions and practical next steps.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "rencana-bisnis",
    "label": "Rencana Bisnis & SWOT",
    "description": "Buat rencana bisnis dan analisis SWOT dari brief usaha.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "bp-jenis-bisnis",
        "label": "Jenis Bisnis *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Kafe, E-commerce Fashion, Jasa Konsultan"
      },
      {
        "id": "bp-lokasi",
        "label": "Lokasi Bisnis",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Jakarta Selatan, Online/Nasional"
      },
      {
        "id": "bp-target-pasar",
        "label": "Target Pasar",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Milenial urban 25-35 tahun, kelas menengah",
        "role": "prompt"
      },
      {
        "id": "bp-modal",
        "label": "Modal Awal (Opsional)",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Rp 50 juta"
      },
      {
        "id": "bp-info-tambahan",
        "label": "Informasi Tambahan",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Produk/layanan utama, keunggulan kompetitif, dll",
        "role": "prompt"
      }
    ],
    "promptIntent": "Develop a structured business plan and SWOT analysis from the supplied venture, goals and constraints, clearly identifying assumptions.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "hr-assistant",
    "label": "HR Assistant",
    "description": "Buat materi HR sesuai peran, kebutuhan, dan konteks tim.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "hr-posisi",
        "label": "Nama Posisi *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Sales Manager, Barista, Data Scientist"
      },
      {
        "id": "hr-industri",
        "label": "Industri/Bidang Usaha",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Retail, F&B, Teknologi, Keuangan"
      },
      {
        "id": "hr-level",
        "label": "Level Posisi",
        "type": "select",
        "defaultValue": "entry",
        "required": false,
        "options": [
          {
            "value": "entry",
            "label": "Entry Level / Fresh Graduate"
          },
          {
            "value": "junior",
            "label": "Junior (1-3 tahun)"
          },
          {
            "value": "senior",
            "label": "Senior (3-5 tahun)"
          },
          {
            "value": "lead",
            "label": "Lead / Supervisor"
          },
          {
            "value": "manager",
            "label": "Manager"
          },
          {
            "value": "director",
            "label": "Director / C-Level"
          }
        ]
      },
      {
        "id": "hr-keahlian",
        "label": "Keahlian Khusus (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: MS Excel, Photoshop, Python, Komunikasi, Kepemimpinan",
        "role": "prompt"
      }
    ],
    "promptIntent": "Draft the selected HR document from the supplied role and organization details, using clear criteria and practical structure.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "financial-forecast",
    "label": "Simulasi Anggaran",
    "description": "Susun simulasi anggaran dari pendapatan dan biaya Anda.",
    "iconId": "briefcase",
    "group": "business-tools",
    "kind": "text",
    "fields": [
      {
        "id": "ff-pendapatan",
        "label": "Proyeksi Pendapatan Bulanan *",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Rp 50.000.000 atau 50 juta"
      },
      {
        "id": "ff-tipe",
        "label": "Tipe Bisnis",
        "type": "select",
        "defaultValue": "umkm",
        "required": false,
        "options": [
          {
            "value": "umkm",
            "label": "UMKM / Bisnis Kecil"
          },
          {
            "value": "menengah",
            "label": "Bisnis Menengah"
          },
          {
            "value": "besar",
            "label": "Bisnis Besar"
          },
          {
            "value": "startup",
            "label": "Startup"
          }
        ]
      },
      {
        "id": "ff-industri",
        "label": "Industri",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: F&B, Retail, Jasa, E-commerce"
      },
      {
        "id": "ff-skenario",
        "label": "Skenario yang Ingin Disimulasikan",
        "type": "select",
        "defaultValue": "normal",
        "required": false,
        "options": [
          {
            "value": "normal",
            "label": "Normal - Alokasi Anggaran Standar"
          },
          {
            "value": "growth",
            "label": "Growth - Fokus Ekspansi & Marketing"
          },
          {
            "value": "efficiency",
            "label": "Efficiency - Fokus Penghematan"
          },
          {
            "value": "custom",
            "label": "Custom Scenario"
          }
        ]
      },
      {
        "id": "ff-detail",
        "label": "Detail Tambahan (Opsional)",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Jumlah karyawan, rencana investasi, target profit margin, dll",
        "role": "prompt"
      }
    ],
    "promptIntent": "Prepare a transparent budget simulation using the supplied income, costs and time horizon. Show calculations, assumptions and alternative scenarios.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "opal",
    "label": "Opal Image to Video",
    "description": "Siapkan brief image-to-video; rendering memerlukan provider video.",
    "iconId": "film",
    "group": "video-audio",
    "kind": "video",
    "fields": [
      {
        "id": "opal-reference",
        "label": "Foto referensi",
        "type": "file",
        "required": false,
        "defaultValue": "",
        "accept": "image/png,image/jpeg,image/webp",
        "role": "image"
      },
      {
        "id": "opal-motion",
        "label": "Gerakan dan adegan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt"
      },
      {
        "id": "opal-duration",
        "label": "Durasi",
        "type": "choice",
        "options": [
          {
            "value": "5",
            "label": "5 detik"
          },
          {
            "value": "8",
            "label": "8 detik"
          }
        ],
        "defaultValue": "8",
        "required": false
      }
    ],
    "promptIntent": "Prepare an image-to-video production brief from the supplied image and motion description. Do not claim a video has rendered without a configured video provider.",
    "isNew": false,
    "hidden": false,
    "limitations": [
      "Rendering video membutuhkan provider video yang mendukung image-to-video. Gemini teks/gambar dapat membantu menyusun brief, tetapi belum merender video."
    ]
  },
  {
    "id": "voice-over",
    "label": "Voice Over",
    "description": "Buat narasi suara dengan pilihan voice dan gaya bicara.",
    "iconId": "mic",
    "group": "video-audio",
    "kind": "audio",
    "fields": [
      {
        "id": "vo-text-input",
        "label": "Masukkan Teks",
        "type": "textarea",
        "defaultValue": "",
        "required": true,
        "placeholder": "Contoh: Halo semuanya! Hari ini kita akan membahas penemuan terbaru di dunia sains...",
        "role": "prompt"
      },
      {
        "id": "vo-style-input",
        "label": "Kontrol Gaya Bicara (Opsional):",
        "type": "text",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Ucapkan dengan nada gembira dan bersemangat",
        "role": "style"
      },
      {
        "id": "vo-pitch-slider",
        "label": "Pitch",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -20.0,
        "max": 20.0,
        "step": 0.1
      },
      {
        "id": "vo-volume-slider",
        "label": "Volume",
        "type": "range",
        "defaultValue": 0.0,
        "required": false,
        "min": -20.0,
        "max": 20.0,
        "step": 1.0
      },
      {
        "id": "vo-speed-slider",
        "label": "Speed",
        "type": "range",
        "defaultValue": 1.0,
        "required": false,
        "min": 0.25,
        "max": 2.0,
        "step": 0.25
      },
      {
        "id": "voice-over-choice-1",
        "label": "Quick Templates",
        "type": "choice",
        "defaultValue": "intro",
        "required": false,
        "role": "voice",
        "options": [
          {
            "value": "intro",
            "label": "Intro"
          },
          {
            "value": "narasi",
            "label": "Narasi"
          },
          {
            "value": "iklan",
            "label": "Iklan"
          },
          {
            "value": "podcast",
            "label": "Podcast"
          }
        ]
      },
      {
        "id": "voice",
        "label": "Pilihan voice",
        "type": "choice",
        "options": [
          {
            "value": "Puck",
            "label": "Puck — Pria"
          },
          {
            "value": "Kore",
            "label": "Kore — Wanita"
          },
          {
            "value": "Zephyr",
            "label": "Zephyr — Wanita"
          },
          {
            "value": "Fenrir",
            "label": "Fenrir — Pria"
          },
          {
            "value": "Achird",
            "label": "Achird — Pria"
          },
          {
            "value": "Charon",
            "label": "Charon — Pria"
          },
          {
            "value": "Sadachbia",
            "label": "Sadachbia — Pria"
          },
          {
            "value": "Sulafat",
            "label": "Sulafat — Wanita"
          },
          {
            "value": "Aoede",
            "label": "Aoede — Wanita"
          },
          {
            "value": "Umbriel",
            "label": "Umbriel — Pria"
          },
          {
            "value": "Gacrux",
            "label": "Gacrux — Wanita"
          },
          {
            "value": "Leda",
            "label": "Leda — Wanita"
          },
          {
            "value": "Orus",
            "label": "Orus — Pria"
          },
          {
            "value": "Enceladus",
            "label": "Enceladus — Pria"
          },
          {
            "value": "Algenib",
            "label": "Algenib — Pria"
          },
          {
            "value": "Vindemiatrix",
            "label": "Vindemiatrix — Wanita"
          },
          {
            "value": "Sadaltager",
            "label": "Sadaltager — Pria"
          },
          {
            "value": "Schedar",
            "label": "Schedar — Pria"
          },
          {
            "value": "Iapetus",
            "label": "Iapetus — Pria"
          }
        ],
        "defaultValue": "Puck",
        "required": false,
        "role": "voice"
      }
    ],
    "promptIntent": "Read the supplied narration in the selected voice and speaking style, honoring the requested pace and tone without adding unrelated words.",
    "isNew": false,
    "hidden": false
  },
  {
    "id": "video-analyzer",
    "label": "Video Analyzer",
    "description": "Ambil frame video lalu uraikan adegan menjadi prompt.",
    "iconId": "film",
    "group": "video-audio",
    "kind": "text",
    "fields": [
      {
        "id": "va-video-upload",
        "label": "Upload Video",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "video/*",
        "role": "video"
      },
      {
        "id": "video-analyzer-choice-1",
        "label": "Jumlah Frames untuk Analisis:",
        "type": "choice",
        "defaultValue": "3",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "3",
            "label": "3 Frames"
          },
          {
            "value": "5",
            "label": "5 Frames"
          },
          {
            "value": "10",
            "label": "10 Frames"
          },
          {
            "value": "15",
            "label": "15 Frames"
          }
        ]
      },
      {
        "id": "video-analyzer-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Analyze the ordered still frames extracted from the uploaded video. Describe subjects, camera movement, actions, lighting and scene progression, distinguishing observation from inference.",
    "isNew": false,
    "hidden": false,
    "capability": "video-analysis"
  },
  {
    "id": "video-frames",
    "label": "Video Frames",
    "description": "Buat urutan frame produk dengan gerak dan sudut kamera pilihan.",
    "iconId": "film",
    "group": "video-audio",
    "kind": "image",
    "fields": [
      {
        "id": "videoframes-image-upload",
        "label": "Upload Product Photo",
        "type": "file",
        "defaultValue": "",
        "required": true,
        "accept": "video/*",
        "role": "video"
      },
      {
        "id": "videoframes-animation-selection",
        "label": "Animation Type",
        "type": "choice",
        "defaultValue": "rotation",
        "required": false,
        "options": [
          {
            "value": "rotation",
            "label": "360° Rotation"
          },
          {
            "value": "zoom",
            "label": "Zoom In/Out"
          },
          {
            "value": "reveal",
            "label": "Product Reveal"
          },
          {
            "value": "pan",
            "label": "Pan Around"
          },
          {
            "value": "float",
            "label": "Floating"
          },
          {
            "value": "explode",
            "label": "Exploded View"
          }
        ]
      },
      {
        "id": "videoframes-background-selection",
        "label": "Background Style",
        "type": "choice",
        "defaultValue": "clean-white",
        "required": false,
        "options": [
          {
            "value": "clean-white",
            "label": "Clean White"
          },
          {
            "value": "gradient",
            "label": "Gradient"
          },
          {
            "value": "studio",
            "label": "Studio"
          },
          {
            "value": "animated",
            "label": "Animated"
          }
        ]
      },
      {
        "id": "videoframes-aspect-selection",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "1:1",
        "required": false,
        "role": "ratio",
        "options": [
          {
            "value": "1:1",
            "label": "1:1 Square"
          },
          {
            "value": "9:16",
            "label": "9:16 Story"
          },
          {
            "value": "16:9",
            "label": "16:9 Video"
          }
        ]
      },
      {
        "id": "videoframes-count-selection-grid",
        "label": "Jumlah Generate",
        "type": "choice",
        "defaultValue": "4",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "1",
            "label": "1"
          },
          {
            "value": "2",
            "label": "2"
          },
          {
            "value": "3",
            "label": "3"
          },
          {
            "value": "4",
            "label": "4"
          },
          {
            "value": "5",
            "label": "5"
          },
          {
            "value": "6",
            "label": "6"
          },
          {
            "value": "7",
            "label": "7"
          },
          {
            "value": "8",
            "label": "8"
          },
          {
            "value": "9",
            "label": "9"
          },
          {
            "value": "10",
            "label": "10"
          }
        ]
      },
      {
        "id": "video-frames-brief",
        "label": "Instruksi tambahan",
        "type": "textarea",
        "required": false,
        "defaultValue": "",
        "role": "prompt",
        "placeholder": "Tambahkan detail yang ingin diterapkan"
      }
    ],
    "promptIntent": "Create the requested numbered frame in a coherent product-animation image sequence. Preserve the product and consistent scene while applying the selected motion and camera change.",
    "isNew": false,
    "hidden": false,
    "capability": "image-sequence"
  },
  {
    "id": "story-board",
    "label": "Story Board",
    "description": "Susun storyboard berurutan dari topik dan gaya visual.",
    "iconId": "film",
    "group": "video-audio",
    "kind": "image",
    "fields": [
      {
        "id": "storyboard-topic",
        "label": "Topik Story",
        "type": "textarea",
        "defaultValue": "",
        "required": false,
        "placeholder": "Contoh: Tutorial membuat kopi latte, Campaign launching produk baru, Behind the scenes proses produksi, dll.",
        "role": "prompt"
      },
      {
        "id": "story-board-choice-1",
        "label": "Tipe Story",
        "type": "choice",
        "defaultValue": "social-media",
        "required": false,
        "options": [
          {
            "value": "social-media",
            "label": "Social Media"
          },
          {
            "value": "video-content",
            "label": "Video Content"
          },
          {
            "value": "film-scene",
            "label": "Film Scene"
          },
          {
            "value": "tutorial",
            "label": "Tutorial"
          },
          {
            "value": "marketing",
            "label": "Marketing"
          },
          {
            "value": "product-demo",
            "label": "Product Demo"
          },
          {
            "value": "event",
            "label": "Event Coverage"
          },
          {
            "value": "animation",
            "label": "Animation"
          }
        ]
      },
      {
        "id": "story-board-choice-2",
        "label": "Jumlah Frame",
        "type": "choice",
        "defaultValue": "5",
        "required": false,
        "role": "count",
        "options": [
          {
            "value": "5",
            "label": "5 Frame"
          },
          {
            "value": "10",
            "label": "10 Frame"
          },
          {
            "value": "20",
            "label": "20 Frame"
          }
        ]
      },
      {
        "id": "story-board-choice-3",
        "label": "Style Visual",
        "type": "choice",
        "defaultValue": "sketch",
        "required": false,
        "role": "style",
        "options": [
          {
            "value": "sketch",
            "label": "Sketch"
          },
          {
            "value": "realistic",
            "label": "Realistic"
          },
          {
            "value": "cartoon",
            "label": "Cartoon"
          },
          {
            "value": "minimalist",
            "label": "Minimalist"
          },
          {
            "value": "cinematic",
            "label": "Cinematic"
          },
          {
            "value": "comic",
            "label": "Comic Style"
          }
        ]
      },
      {
        "id": "story-board-choice-4",
        "label": "Bahasa Deskripsi",
        "type": "choice",
        "defaultValue": "indonesian",
        "required": false,
        "role": "language",
        "options": [
          {
            "value": "indonesian",
            "label": "Bahasa Indonesia"
          },
          {
            "value": "english",
            "label": "English"
          }
        ]
      },
      {
        "id": "story-board-choice-5",
        "label": "Rasio aspek",
        "type": "choice",
        "defaultValue": "16:9",
        "required": false,
        "options": [
          {
            "value": "16:9",
            "label": "16:9 Horizontal"
          },
          {
            "value": "9:16",
            "label": "9:16 Vertikal"
          },
          {
            "value": "1:1",
            "label": "1:1 Square"
          }
        ],
        "role": "ratio"
      }
    ],
    "promptIntent": "Create the requested numbered storyboard frame for the supplied story topic, selected story type and style. Maintain characters, environment and narrative continuity between frames.",
    "isNew": false,
    "hidden": false,
    "capability": "storyboard"
  }
];
