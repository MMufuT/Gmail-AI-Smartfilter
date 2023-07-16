const { google } = require('googleapis');
const { Configuration, OpenAIApi } = require('openai')
const bluePrint = require('./instructions')

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
}))

async function compareQueryWithEmail(email, query) {
  const instructions = bluePrint(email.sender, email.subject, email.body, query);

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: instructions}],
  })
  return response.data.choices[0].message.content

  //return result === 'match';
}





const validateAccess = (oAuth2Client, user) => {
  if(oAuth2Client.isTokenExpiring()){
    oAuth2Client.setCredentials({
      refresh_token: user.refreshToken
    });
    user.accessToken = oAuth2Client.getAccessToken();
  }
}


const getGmailApiClient = (oAuth2Client, user) => {
  validateAccess(oAuth2Client, user);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  return gmail;
  }

  const getLatestEmail = (gmail) => {
    gmail.users.messages.list(
      {
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults: 10,
        q: 'in:inbox', // Optional: You can use additional search parameters if needed
        orderBy: 'internalDate desc', // Sort messages by internalDate in descending order
      },
      (err, response) => {
        if (err) {
          console.error('Error retrieving latest email:', err);
          return;
        }

        for(let email of response.data.messages){
          const emailId = email.id;
          gmail.users.messages.get(
            {
              userId: 'me',
              id: emailId,
              format: 'full',
            },
            async (err, response) => {
              if (err) {
                console.error('Error retrieving email:', err);
                return;
              }
    
              const emailData = response.data;
              const headers = emailData.payload.headers;
              const sender = headers.find((header) => header.name === 'From').value;
              const subject = headers.find((header) => header.name === 'Subject').value;
              const body = emailData.snippet;
              const email = {sender, subject, body}

              const query = 'search for any emails that are receipts or order confirmations' 
              const isMatch = await compareQueryWithEmail(email, query)
    
              console.log(sender + '\nMatch?: ' + isMatch + '\n')

              
    
              // Process the latest email as needed
            }
          );
        }
      }
    );
  }


module.exports = {
    getGmailApiClient,
    getLatestEmail
}

