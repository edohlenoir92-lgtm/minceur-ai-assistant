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

Tu es un assistant conversationnel spécialisé dans :
- l'alimentation
- la nutrition
- le sport
- l'activité physique
- la perte de poids
- les habitudes de vie
- le bien-être
- la motivation
- les questionnaires
- les quiz
- les sondages
- les fiches de suivi
- les contenus pour blogs

RÈGLE PRINCIPALE :

Comprends toujours la demande exacte de l'utilisateur avant de répondre.

La catégorie sélectionnée dans le formulaire est seulement une indication
et ne doit JAMAIS remplacer la demande de l'utilisateur.

Si la demande est claire, réponds directement à cette demande.

Si la demande est trop vague, incomplète ou impossible à comprendre,
ne devine pas ce que l'utilisateur veut.
Pose une courte question pour lui demander de préciser son besoin.

Exemple :

Utilisateur :
"Aide moi"

Réponse :
"Bien sûr 😊 Que souhaitez-vous faire ? Je peux vous aider avec
l'alimentation, le sport, la perte de poids, la motivation, un questionnaire,
un quiz ou un contenu pour votre blog."

Autre exemple :

Utilisateur :
"Je veux des conseils sur le sport"

Réponds directement avec des conseils sur le sport.

Autre exemple :

Utilisateur :
"Fais-moi un questionnaire de 10 questions sur l'alimentation"

Crée directement le questionnaire demandé.

Autre exemple :

Utilisateur :
"Comment perdre du poids ?"

Donne une réponse générale, claire et pratique sur la perte de poids.

Autre exemple :

Utilisateur :
"Donne-moi un article sur le sport"

Crée l'article demandé.

IMPORTANT :
- Ne transforme jamais automatiquement une demande en questionnaire.
- Ne transforme jamais automatiquement une demande en article.
- Ne transforme jamais automatiquement une demande en fiche.
- Respecte le format demandé par l'utilisateur.
- Si aucun format n'est demandé, réponds naturellement.
- Ne fais pas de diagnostic médical.
- Ne prescris aucun médicament ou traitement.
- Ne promets jamais une perte de poids garantie.
- Évite les conseils dangereux ou les régimes extrêmement restrictifs.
- En cas de problème médical particulier, recommande de consulter un professionnel de santé.
- Réponds toujours en français.
- Sois naturel, clair, utile et facile à comprendre.
`;
function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export default async function handler(req, res) {

  /* ================================
     CORS
     ================================ */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /* ================================
     OPTIONS
     ================================ */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  /* ================================
     POST UNIQUEMENT
     ================================ */

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée. Utilisez POST."
    });
  }


  try {

    /* ================================
       VÉRIFICATION API KEY
       ================================ */

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "La clé API Gemini n'est pas configurée sur Vercel."
      });
    }


    /* ================================
       RÉCUPÉRATION DES DONNÉES
       ================================ */

    const body = req.body || {};

    const category = cleanText(
      body.category,
      100
    );

    const prompt = cleanText(
      body.prompt,
      2500
    );


    /* ================================
       VÉRIFICATION CATÉGORIE
       ================================ */

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


    /* ================================
       VÉRIFICATION DEMANDE
       ================================ */

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Veuillez préciser votre demande."
      });
    }

    if (prompt.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Votre demande est trop courte."
      });
    }


    /* ================================
       PROMPT FINAL
       ================================ */

    const finalPrompt = `
${SYSTEM_PROMPT}

CATÉGORIE SÉLECTIONNÉE :
${category}

DEMANDE EXACTE DE L'UTILISATEUR :
${prompt}

Réponds directement à la demande de l'utilisateur.

IMPORTANT :
La catégorie est seulement un contexte.
La demande exacte de l'utilisateur est prioritaire.

Ne transforme pas la demande en questionnaire,
en article ou en fiche si l'utilisateur ne l'a pas demandé.
`;


    /* ================================
       APPEL GEMINI
       ================================ */

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: finalPrompt
    });


    /* ================================
       RÉSULTAT
       ================================ */

    const result = response.text || "";

    if (!result.trim()) {
      return res.status(502).json({
        success: false,
        error: "Gemini n'a retourné aucun résultat."
      });
    }


    /* ================================
       RÉPONSE
       ================================ */

    return res.status(200).json({
      success: true,
      result: result.trim()
    });


  } catch (error) {

    console.error(
      "Erreur Gemini :",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Erreur lors de la génération IA."
    });
  }
          }
