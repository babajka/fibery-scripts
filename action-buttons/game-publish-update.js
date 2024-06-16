const fibery = context.getService('fibery');
const http = context.getService('http');
const utils = context.getService('utils');

const API_URL = 'https://api.wir.by/api';
const FRONTEND_NAME = 'dev.wir.by';
const FRONTEND_URL = 'https://' + FRONTEND_NAME;
const LOG_FIELD = 'Publication Log DEV'
// TODO: Add auth token below to act as bot user.
const AUTH_TOKEN = '';

// Keep ROLES_ALLOWED in sync with Role's Identifiers.
const ROLES_ALLOWED = ['editor', 'developer'];

const GAME_NAME = ''; // TODO: Choose between 'fortune' and 'tinder';

const thisArticle = args.currentEntities[0];
const user = args.currentUser;

const userAllowed = async () => {
    const u = await fibery.getEntityById('fibery/user', user['Id'], ['Roles']);
    const uRoles = await Promise.all(
        u['Roles'].map(
            ({ Id }) => fibery.getEntityById('Projects/Role', Id, ['Identifier'])
        )
    ).then(roles => roles.map(({ Identifier }) => Identifier))
    return ROLES_ALLOWED.some(roleAllowed => uRoles.includes(roleAllowed));
}

if (!await userAllowed()) {
    return "❌ У вас няма правоў на выкананне дзеяння."
}

const messageBoxSecret = thisArticle[LOG_FIELD].Secret;

const setLog = async (message) => {
    return fibery.setDocumentContent(messageBoxSecret, message, 'md').catch((err) => {
        console.log('failed to set message box:', message, err);
    });
}

const timeNow = () => {
    const now = new Date();
    now.setHours(now.getHours() + 3);
    return now.toLocaleString();
}

const logPrefix = () => `[${user['Name']}](${utils.getEntityUrl('fibery/user', user['Public Id'])}), ${timeNow()}`;

await http.postAsync(`${API_URL}/games/${GAME_NAME}/fibery/import`, {
    body: {
        'fiberyPublicId': thisArticle['Public Id']
    },
    headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
    }
}).then(resp => {
    const successMessage = `✅ ${logPrefix()} :  паспяхова апублікавалі гульню з fibery на [${FRONTEND_NAME}](${FRONTEND_URL}). Даступная па спасылцы: [${FRONTEND_NAME}/game/${thisArticle['Slug']}](${FRONTEND_URL}/game/${thisArticle['Slug']})`;
    return setLog(successMessage);
}).catch(({ innerError: { message, body } }) => {
    const errors = JSON.parse(body);
    const errorMessage = `❌ ${logPrefix()} :  памылка пры публікацыі гульні з fibery на [${FRONTEND_NAME}](${FRONTEND_URL}):
        ${message}
\`\`\`
${JSON.stringify(errors, null, 2)}
\`\`\``
    return setLog(errorMessage);
})

return `Дзеянне выкананае 🌀 Праверце паспяховасць у полі "${LOG_FIELD}"`;
