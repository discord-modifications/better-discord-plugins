/**
 * @name DataSaver
 * @source https://github.com/slow/better-discord-plugins/blob/master/DataSaver/DataSaver.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/DataSaver/DataSaver.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/DataSaver/DataSaver.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

class DataSaver {
   constructor() {
      Object.assign(this, ...Object.entries({
         getName: 'Data Saver',
         getDescription: 'Saves friends & Servers every 30 minutes to a file.',
         getVersion: '1.0.1',
         getAuthor: 'eternal'
      }).map(([f, v]) => ({ [f]: () => v })));
   }

   start() {
      const { findModuleByProps } = BdApi;

      let { getRelationships } = findModuleByProps('getRelationships');
      let { getUser } = findModuleByProps('getUser');
      let { getGuilds } = findModuleByProps('getGuilds');
      let fs = require('fs');

      this.interval = setInterval(async () => {
         let path = {
            friends: '%userprofile%\\Documents\\Discord\\',
            servers: '%userprofile%\\Documents\\Discord\\'
         };

         let fileNames = {
            friends: 'Discord Friends',
            servers: 'Discord Servers'
         };

         let obj = {
            servers: [],
            friends: []
         };

         for (let friend of Object.keys(getRelationships())) {
            friend = await getUser(friend);

            if (!friend || !friend.id) continue;

            obj.friends.push({
               username: friend.username,
               discriminator: friend.discriminator,
               id: friend.id,
               tag: `${friend.username}#${friend.discriminator}`
            });
         };

         for (let { id, name, vanityURLCode, ownerId } of Object.values(getGuilds())) {
            obj.servers.push({ id, name, vanityURLCode, ownerId });
         }

         for (let save of Object.keys(obj)) {
            let savePath = path[save].replace(/%([^%]+)%/g, (_, n) => process.env[n]);
            if (!fs.existsSync(savePath)) {
               fs.mkdirSync(savePath, { recursive: true });
            }
            fs.writeFile(`${path[save]}${fileNames[save]}.json`.replace(/%([^%]+)%/g, (_, n) => process.env[n]), JSON.stringify(obj[save]), (err) => {
               if (err) console.log(err);
            });
         }
      }, 18e5);
   }

   stop() {
      clearInterval(this.interval);
   }
}
