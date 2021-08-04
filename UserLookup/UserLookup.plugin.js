/**
 * @name UserLookup
 * @description Adds a command to look up information about the user using their ID.
 * @version 2.0.0
 * @source https://github.com/slow/better-discord-plugins/blob/master/UserLookup/UserLookup.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/UserLookup/UserLookup.plugin.js
 * @author eternal
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)

    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
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

const { findModuleByProps } = BdApi;
const { getUser } = findModuleByProps('getUser');
const { ApplicationCommandOptionType: OptionTypes } = findModuleByProps('ApplicationCommandType');

class UserLookup {
   commands = new (class Commands {
      constructor() {
         this.messages = BdApi.findModuleByProps('sendMessage');
         this.messageUtils = BdApi.findModuleByProps('createBotMessage');
         this.avatars = BdApi.findModuleByProps('BOT_AVATARS');

         const DiscordCommands = BdApi.findModuleByProps('BUILT_IN_COMMANDS');
         if (!DiscordCommands.BUILT_IN_SECTIONS['betterdiscord']) {
            DiscordCommands.BUILT_IN_SECTIONS['betterdiscord'] = ({
               icon: 'https://github.com/BetterDiscord.png',
               id: 'betterdiscord',
               name: 'BetterDiscord',
               type: 0
            });
         }

         this.avatars.BOT_AVATARS.better_discord = 'https://github.com/BetterDiscord.png';
      }

      register(caller, options) {
         const DiscordCommands = BdApi.findModuleByProps('BUILT_IN_COMMANDS');

         let old = options.execute;
         if (!old) return;

         options.execute = async (...args) => {
            let res = null;

            try {
               res = await old(...args);
            } catch (e) {
               res = {
                  send: false,
                  result: `An error occurred while executing the command: ${e.message}.\nCheck the console for more details.`
               };
            }

            let channelId = args[1].channel.id;
            if (res && typeof res == 'object' && !Array.isArray(res) && res.send && typeof res.result == 'string') {
               this.messages.sendMessage(channelId, {
                  content: res.result,
                  tts: false,
                  validNonShortcutEmojis: [],
                  invalidEmojis: []
               });
            } else if (res?.result || typeof res == 'string') {
               let message = this.messageUtils.createBotMessage(channelId, '');
               message.author.username = 'BetterDiscord';
               message.author.avatar = 'better_discord';

               if (typeof res.result === 'string') {
                  message.content = res.result;
               } else {
                  message.embeds.push(res.result);
               }

               this.messages.receiveMessage(channelId, message);
            }
         };

         const { randomBytes } = require('crypto');
         const cmd = Object.assign({
            description: 'No description provided.',
            id: randomBytes(16).toString('hex')
         }, options, {
            __registerId: caller,
            applicationId: 'betterdiscord',
            type: 3,
            target: 1
         });

         DiscordCommands.BUILT_IN_COMMANDS.push(cmd);

         return () => {
            const index = DiscordCommands.BUILT_IN_COMMANDS.indexOf(cmd);
            if (index < 0) return false;
            DiscordCommands.BUILT_IN_COMMANDS.splice(index, 1);
         };
      }

      unregister(caller) {
         const DiscordCommands = BdApi.findModuleByProps('BUILT_IN_COMMANDS');

         let index = DiscordCommands.BUILT_IN_COMMANDS.findIndex(cmd => cmd.__registerId === caller);

         while (index > -1) {
            DiscordCommands.BUILT_IN_COMMANDS.splice(index, 1);
            index = DiscordCommands.BUILT_IN_COMMANDS.findIndex(cmd => cmd.__registerId === caller);
         }
      }
   })();

   start() {
      this.commands.register('user-lookup', {
         name: 'id',
         description: 'Lookup user info from a user id',
         execute: async (args) => {
            let id = args.id[0].text;

            try {
               let user = await getUser(String(id));
               let tag = `${user.username}#${user.discriminator}`;
               let avatar;

               if (!user.avatar) {
                  avatar = `https://canary.discord.com${user.avatarURL}`;
               } else {
                  avatar = `https://cdn.discordapp.com/avatars/${String(user.id)}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=4096`;
               }

               let unix = (id / 4194304) + 1420070400000;
               let time = new Date(unix);
               let date = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()} `;
               let difference = UserLookup.differentiate(Date.now(), unix);

               return {
                  result: {
                     type: 'rich',
                     title: `User Lookup for ${tag}`,
                     color: 0xff0000,
                     fields: [
                        { name: 'ID', value: String(id) },
                        { name: 'Tag', value: `<@${id}> ` },
                        { name: 'Username', value: tag },
                        { name: 'Bot', value: user.bot ? 'Yes' : 'No' },
                        { name: 'Avatar', value: `[URL](${avatar})` },
                        { name: 'Created', value: `${date} (${difference})` }
                     ]
                  },
                  embed: true
               };
            } catch (err) {
               return {
                  result: 'Invalid ID.'
               };
            }
         },
         options: [
            {
               type: OptionTypes.STRING,
               name: 'id',
               description: 'The ID of the user you want to search.',
               required: true
            }
         ]
      });
   }

   static differentiate(current, previous) {
      var msPerMinute = 60 * 1000;
      var msPerHour = msPerMinute * 60;
      var msPerDay = msPerHour * 24;
      var msPerMonth = msPerDay * 30;
      var msPerYear = msPerDay * 365;
      var elapsed = current - previous;
      if (elapsed < msPerMinute) {
         return `${Math.round(elapsed / 1000)} seconds ago`;
      } else if (elapsed < msPerHour) {
         return `${Math.round(elapsed / msPerMinute)} minutes ago`;
      } else if (elapsed < msPerDay) {
         return `${Math.round(elapsed / msPerHour)} hours ago`;
      } else if (elapsed < msPerMonth) {
         return `${Math.round(elapsed / msPerDay)} days ago`;
      } else if (elapsed < msPerYear) {
         return `${Math.round(elapsed / msPerMonth)} months ago`;
      } else {
         return `${Math.round(elapsed / msPerYear)} years ago`;
      }
   }

   stop() {
      this.commands.unregister('user-lookup');
   }
};
