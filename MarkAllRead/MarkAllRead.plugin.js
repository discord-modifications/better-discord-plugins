/**
 * @name MarkAllRead
 * @description Silences your typing indicator/status.
 * @version 2.0.0
 * @source https://github.com/slow/better-discord-plugins/blob/master/MarkAllRead/MarkAllRead.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/MarkAllRead/MarkAllRead.plugin.js
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
const { getMutableGuildAndPrivateChannels } = findModuleByProps('getChannel');
const unreadAcks = findModuleByProps('ack', 'ackCategory');
const messageStore = findModuleByProps('hasUnread', 'lastMessageId');

class MarkAllRead {
   commands = new (class Commands {
      constructor() {
         this.messages = BdApi.findModuleByProps('sendMessage');
         this.messageUtils = BdApi.findModuleByProps('createBotMessage');
         this.avatars = BdApi.findModuleByProps('BOT_AVATARS');

         const DiscordCommands = BdApi.findModuleByProps('BUILT_IN_COMMANDS');
         if (!DiscordCommands.BUILT_IN_SECTIONS.some(e => e.id === 'betterdiscord')) {
            DiscordCommands.BUILT_IN_SECTIONS.push({
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
      this.commands.register('read', {
         name: 'read',
         description: 'Read all channels & remove pings.',
         execute: async () => {
            let channels = Object.keys(getMutableGuildAndPrivateChannels());
            const unreads = channels.map(c => ({
               channelId: c,
               messageId: messageStore.lastMessageId(c)
            }));
            await unreadAcks.bulkAck(unreads);
         }
      });
   }

   stop() {
      this.commands.unregister('read');
   }
};
