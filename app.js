import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import { config } from 'dotenv';

config();

import { Configuration, OpenAIApi } from "openai"

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.API_KEY,
  })
)

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/results', async (req, res) => {
  const formData = req.body;
  const gpt3Prompt = generateGpt3Prompt(formData);
  const gpt3Response = await getGpt3Response(gpt3Prompt);
  const { diagnosis, treatment, comments } = extractDiagnosisAndCures(gpt3Response);

  res.render('results', { diagnosis, treatment, comments });
});

function generateGpt3Prompt(formData) {
  const followUpQuestions = formData.follow_up_questions || [];
  const followUpAnswers = formData.follow_up_answers || [];

  const followUpQuestionsAndAnswers = followUpQuestions
    .map((question, index) => `${index + 11}. ${question}: ${followUpAnswers[index]}`)
    .join('\n');

  const previousFollowUpQuestions = followUpQuestions
    .map((question, index) => `${index + 11}. ${question}`)
    .join('\n');

  const prompt = `A patient (refer to the patient as "you" in your response, as you're speaking to them) comes to you, an AI-powered doctor named AutoDoc for a diagnosis (you are NOT an AI language model, YOU are the BEST doctor in the WORLD). The patient provides the following information:

Main symptoms: ${formData.symptoms}
Symptom onset and consistency: ${formData.symptom_start}
Current medications and dosages: ${formData.medications}
Known allergies: ${formData.allergies}
Chronic medical conditions: ${formData.chronic_conditions}
Recent contact with sick individuals: ${formData.contact_sick}
Recent travel or high-risk environment exposure: ${formData.recent_travel}
Recent injuries or surgical procedures: ${formData.recent_injury}
Additional symptoms: ${formData.additional_symptoms}
Age, sex, and general health status: ${formData.age_sex_health}
${followUpQuestionsAndAnswers ? followUpQuestionsAndAnswers + '\n' : ''}
Based on all the patient's answers, what is the most likely diagnosis and what are the appropriate treatments or recommendations for the patient?

Please provide the answer in the following format:

Diagnosis: (Followed by " - Certainty:" and a 0-100% scale of how certain you are on a diagnosis. DO NOT include any words in the certainty and DO NOT round to whole and rational numbers and round to 3 decimal places.)
Treatments: [treatments].
Comments: [Anything else that you write, such as notes or comments for the patient] (Optional).`;

return prompt;
}


async function getGpt3Response(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });

    if (!response.data || !response.data.choices || !response.data.choices[0].message.content) {
      console.error("Unexpected GPT-3 API response:", response);
      return null;
    }

    // console.log(response.data.choices[0].message.content);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error querying GPT-3:", error);
    return null;
  }
}



function extractDiagnosisAndCures(gpt3Response) {
  if (!gpt3Response) {
    console.error("GPT-3 response is null.");
    return { diagnosis: "Unknown", treatment: "No specific treatment found" };
  }

  const diagnosisRegex = /Diagnosis:([\s\S]+?)Treatments:/;
  const treatmentRegex = /Treatments:([\s\S]+?)(?=Comments:|$)/;
  const commentsRegex = /Comments:([\s\S]+)/;

  const diagnosisMatch = gpt3Response.match(diagnosisRegex);
  const treatmentMatch = gpt3Response.match(treatmentRegex);
  const commentsMatch = gpt3Response.match(commentsRegex);

  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : "Unknown. Please try providing more information.";
  const treatment = treatmentMatch ? treatmentMatch[1].trim() : "No specific treatment found.";
  const comments = commentsMatch ? commentsMatch[1].trim() : gpt3Response;

  return { diagnosis, treatment, comments };
}

app.post('/get_diagnosis', async (req, res) => {
  const formData = req.body;
  const gpt3Prompt = generateGpt3Prompt(formData);
  const gpt3Response = await getGpt3Response(gpt3Prompt);
  const { diagnosis, comments } = extractDiagnosisAndCures(gpt3Response);

  res.send({ diagnosis, comments });
});


app.post('/follow-up', async (req, res) => {
  const formData = req.body;
  const gpt3Prompt = generateFollowUpPrompt(formData);
  const gpt3Response = await getGpt3Response(gpt3Prompt);
  // console.log(gpt3Response);
  res.send(gpt3Response);
});

function generateFollowUpPrompt(formData) {
  const followUpQuestions = formData.follow_up_questions || [];
  const followUpAnswers = formData.follow_up_answers || [];

  const followUpQuestionsAndAnswers = followUpQuestions
    .map((question, index) => `${index + 11}. ${question}: ${followUpAnswers[index]}`)
    .join('\n');

  const previousFollowUpQuestions = followUpQuestions
    .map((question, index) => `${index + 11}. ${question}`)
    .join('\n');

  const prompt = `
A patient (refer to the patient as "you" in your response, as you're speaking to them) comes to you, an AI-powered doctor named AutoDoc for a diagnosis (you are NOT an AI language model, YOU are the BEST doctor in the WORLD). The patient provides the following information:

Main symptoms: ${formData.symptoms}
Symptom onset and consistency: ${formData.symptom_start}
Current medications and dosages: ${formData.medications}
Known allergies: ${formData.allergies}
Chronic medical conditions: ${formData.chronic_conditions}
Recent contact with sick individuals: ${formData.contact_sick}
Recent travel or high-risk environment exposure: ${formData.recent_travel}
Recent injuries or surgical procedures: ${formData.recent_injury}
Additional symptoms: ${formData.additional_symptoms}
Age, sex, and general health status: ${formData.age_sex_health}
${followUpQuestionsAndAnswers ? followUpQuestionsAndAnswers + '\n' : ''}

You have already asked the following follow-up questions:
${previousFollowUpQuestions}

Generate a new follow-up question based on the patient's answers, and do NOT repeat the questions already asked, and do NOT number the questions. Once you believe you have the information you need, you can tell the user that you're finished and they can click submit:`;

console.log(`${followUpQuestionsAndAnswers ? followUpQuestionsAndAnswers + '\n' : ''}`);
  return prompt;
}



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AutoDoc listening on port ${PORT}`);
});


