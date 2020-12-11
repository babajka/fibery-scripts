const fibery = context.getService('fibery');

const FRONTEND_URL = 'https://dev.wir.by';

const thisArticle = args.currentEntities[0];

const previewLink = `${FRONTEND_URL}/admin/preview?fiberyPublicId=${thisArticle['Public Id']}`;

await fibery.updateEntity('Content~Marketing/Article', thisArticle['Id'], { 'Preview Link': previewLink });

return `Дзеянне выкананае 🌀 Паглядзіце поле "Preview Link" над кнопкай.`