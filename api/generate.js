import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const ALLOWED_CATEGORIES = [
  "Habitudes alimentaires",
  "Activité physique",
  "Objectifs minceur",
  "Préférences alimentaires",
  "Questionnaire de satisfaction",
  "Quiz nutrition",
  "Formulaire personnalisé"
];

const SYSTEM_PROMPT = `
Tu es l'assistant IA de "Minceur au Fil des Saisons".

Tu aides les visiteurs à créer des questionnaires,
fiches de suivi, sondages, quiz et contenus informatifs
sur la nutrition, les habitudes de vie, l'activité physique
et le bien-être.

RÈGLES :

- Réponds toujours en français.
- Sois clair, professionnel et facile à comprendre.
- Ne pose jamais de diagnostic médical.
- Ne prescris jamais de médicament ou de traitement.
- Ne remplace jamais un professionnel de santé.
- Ne promets jamais une perte de poids garantie.
- Évite les régimes dangereux ou extrêmement restrictifs.
- Pour une situation médicale particulière, recommande
  de consulter un professionnel de santé.

STRUCTURE LES RÉPONSES :

1. Titre
2. Objectif
3. Introduction
4. Questions ou contenu demandé
5. Conseils d'utilisation
6. Note de prudence si nécessaire

Le résultat doit être directement utilisable par
un blogueur ou un créateur de contenu.
`;

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  // Requête OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée."
    });
  }

  try {

    // Vérification de la clé API
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "La clé API Gemini n'est pas configurée."
      });
    }

    const body = req.body || {};

    const category = cleanText(
      body.category,
      100
    );

    const prompt = cleanText(
      body.prompt,
      2500
    );

    // Vérification catégorie
    if (!category) {
      return res.status(400).json({
        success: false,
        error: "La catégorie est obligatoire."
      });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: "Catégorie non autorisée."
      });
    }

    // Vérification demande
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Veuillez préciser votre demande."
      });
    }

    const finalPrompt = `
${SYSTEM_PROMPT}

TYPE DE DOCUMENT :
${category}

DEMANDE DE L'UTILISATEUR :
${prompt}

Génère maintenant le contenu demandé.
`;

    // Génération Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: finalPrompt
    });

    const result = response.text || "";

    if (!result.trim()) {
      return res.status(502).json({
        success: false,
        error: "Gemini n'a retourné aucun résultat."
      });
    }

    return res.status(200).json({
      success: true,
      result: result.trim()
    });

  } catch (error) {

    console.error("Erreur Gemini :", error);

    return res.status(500).json({
      success: false,
      error: "Erreur lors de la génération IA."
    });
  }
      }
