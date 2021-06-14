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

await http.postAsync(`${API_URL}/articles/fibery/import`, {
    body: {
        url: `https://wir.fibery.io/Content~Marketing/Article/${thisArticle['Public Id']}`
    },
    headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
    }
}).then(resp => {
    const articleSlug = thisArticle['Slug-be'] || thisArticle['Slug-ru'] || thisArticle['Slug-en'];
    const successMessage = `✅ ${logPrefix()} :  паспяхова апублікавалі матэрыял з fibery на [${FRONTEND_NAME}](${FRONTEND_URL}). Даступны па спасылцы: [${FRONTEND_NAME}/article/${articleSlug}](${FRONTEND_URL}/article/${articleSlug})`;
    return setLog(successMessage);
}).catch(({ innerError: { message, body } }) => {
    const errors = JSON.parse(body);
    const errorMessage = `❌ ${logPrefix()} :  памылка пры публікацыі матэрыяла з fibery на [${FRONTEND_NAME}](${FRONTEND_URL}):
        ${message}
\`\`\`
${JSON.stringify(errors, null, 2)}
\`\`\``
    return setLog(errorMessage);
})

return `Дзеянне выкананае 🌀 Праверце паспяховасць у полі "${LOG_FIELD}"`;