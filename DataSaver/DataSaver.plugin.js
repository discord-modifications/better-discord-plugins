/**
 * @name DataSaver
 * @source https://github.com/slow/better-discord-plugins/blob/master/DataSaver/DataSaver.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/DataSaver/DataSaver.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/DataSaver/DataSaver.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)
	
  // Offer to self-install for clueless users that try to run this directly.
  var shell = WScript.CreateObject("WScript.Shell");
  var fs = new ActiveXObject("Scripting.FileSystemObject");
  var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
  var pathSelf = WScript.ScriptFullName;
  // Put the user at ease by addressing them in the first person
  shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
  if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
     shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
  } else if (!fs.FolderExists(pathPlugins)) {
     shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
  } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
     fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
     // Show the user where to put plugins in the future
     shell.Exec("explorer " + pathPlugins);
     shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
  }
  WScript.Quit();

@else@*/

class DataSaver {
   constructor() {
      Object.assign(this, ...Object.entries({
         getName: 'Data Saver',
         getDescription: 'Saves friends & Servers every 30 minutes to a file.',
         getVersion: '1.0.3',
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
            fs.writeFile(`${savePath}${fileNames[save]}.json`.replace(/%([^%]+)%/g, (_, n) => process.env[n]), JSON.stringify(obj[save]), (err) => {
               if (err) console.log(err);
            });
         }
      }, 18e5);
   }

   stop() {
      clearInterval(this.interval);
   }
}
