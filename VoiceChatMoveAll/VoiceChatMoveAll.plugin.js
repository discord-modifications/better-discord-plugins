/**
 * @name VoiceChatMoveAll
 * @source https://github.com/slow/better-discord-plugins/blob/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

const { findModuleByProps, findAllModules } = BdApi;
const VCContextMenu = findAllModules(m => m.default && m.default.displayName == 'ChannelListVoiceChannelContextMenu')[0];
const DiscordPermissions = findModuleByProps('Permissions').Permissions;
const { getVoiceChannelId } = findModuleByProps('getVoiceChannelId');
const { getVoiceStates } = findModuleByProps('getVoiceStates');
const { patch } = findModuleByProps('APIError', 'patch');
const Menu = findModuleByProps('MenuGroup', 'MenuItem');
const Permissions = findModuleByProps('getHighestRole');
const { getChannel } = findModuleByProps('getChannel');
const { Endpoints } = findModuleByProps('Endpoints');
const sleep = (time) => new Promise((f) => setTimeout(f, time));

const config = {
   info: {
      name: 'VoiceChatMoveAll',
      authors: [
         {
            name: 'eternal',
            discord_id: '282595588950982656',
         }
      ],
      version: '1.0.0',
      description: 'A context menu utility to move everyone to a certain voice channel.',
      github: 'https://github.com/slow/better-discord-plugins/tree/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js',
      github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/VoiceChatMoveAll/VoiceChatMoveAll.plugin.js',
   }
};

module.exports = !global.ZeresPluginLibrary ? class {
   getName() {
      return config.info.name;
   }

   getAuthor() {
      return config.info.authors[0].name;
   }

   getVersion() {
      return config.info.version;
   }

   getDescription() {
      return config.info.description;
   }

   load() {
      BdApi.showConfirmationModal('Library Missing', `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
         confirmText: 'Download Now',
         cancelText: 'Cancel',
         onConfirm: () => {
            require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
               if (error) return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
               await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
            });
         }
      });
   }

   start() { }

   stop() { }
} : (([Plugin, API]) => {
   const { Patcher, WebpackModules, DiscordModules: { React } } = API;

   return class VoiceChatMoveAll extends Plugin {
      constructor() {
         super();
      }

      start() {
         Patcher.after(VCContextMenu, 'default', (_, args, res) => {
            console.log(_, args, res);
            let channel = args[0].channel;
            if (!channel || !channel.guild_id || !this.canMoveAll(channel)) return res;
            let currentChannel = this.getVoiceChannel();
            if (!currentChannel || currentChannel.members.length < 2) return res;

            let item = React.createElement(Menu.MenuItem, {
               action: async () => {
                  for (const member of currentChannel.members) {
                     await patch({
                        url: Endpoints.GUILD_MEMBER(channel.guild_id, member),
                        body: {
                           channel_id: channel.id
                        }
                     }).catch(async (e) => {
                        await sleep(e.body.retry_after * 1000);
                        currentChannel.members.unshift(member);
                     });
                     await sleep(350);
                  }
               },
               id: 'move-all-vc',
               label: 'Move All'
            });

            let element = React.createElement(Menu.MenuGroup, null, item);
            res.props.children.push(element);
            return res;
         });
      };

      stop() {
         Patcher.unpatchAll();
      };

      getVoiceUserIds(guild, channel) {
         return Object.values(getVoiceStates(guild)).filter((c) => c.channelId == channel).map((a) => a.userId);
      }

      canMoveAll(channel) {
         let currentChannel = this.getVoiceChannel();
         let channelCount = this.getVoiceCount(channel);
         if (
            this.canJoinAndMove(channel) && (Permissions.can(DiscordPermissions.CONNECT, channel) ||
               channel.userLimit == 0 || channel.userLimit - currentChannel.count > channelCount + currentChannel.count
            )
         ) return true;
         return false;
      }

      canJoinAndMove(channel) {
         return Permissions.can(DiscordPermissions.CONNECT, channel) && Permissions.can(DiscordPermissions.MOVE_MEMBERS, channel);
      }

      getVoiceCount(guild, channel) {
         return Object.values(getVoiceStates(guild)).filter((c) => c.channelId == channel).length;
      }

      getVoiceChannel() {
         let channel = getChannel(getVoiceChannelId());
         if (channel) return { channel: channel, members: this.getVoiceUserIds(channel.guild_id, channel.id) };
         return null;
      }
   };
})(global.ZeresPluginLibrary.buildPlugin(config));