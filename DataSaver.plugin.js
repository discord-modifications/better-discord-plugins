//META{"name":"DataSaver"}*//

class DataSaver {
   constructor() {
      Object.assign(this, ...Object.entries({
         getName: 'Data Saver',
         getDescription: 'Saves friends & Servers every 30 minutes.',
         getVersion: '1.0.0',
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
            friends: '%userprofile%\\Documents\\Discord\\Discord Friends.json',
            servers: '%userprofile%\\Documents\\Discord\\Discord Servers.json'
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
            fs.writeFile(path[save].replace(/%([^%]+)%/g, (_, n) => process.env[n]), JSON.stringify(obj[save]), (err) => {
               if (err) console.log(err);
            });
         }
      }, 18e5);
   }

   stop() {
      clearInterval(this.interval);
   }
}
