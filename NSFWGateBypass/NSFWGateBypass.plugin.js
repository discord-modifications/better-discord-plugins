/**
 * @name NSFWGateBypass
 * @source https://github.com/slow/better-discord-plugins/blob/master/NSFWGateBypass/NSFWGateBypass.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/NSFWGateBypass/NSFWGateBypass.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/NSFWGateBypass/NSFWGateBypass.plugin.js
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

const config = {
   info: {
      name: 'NSFWGateBypass',
      authors: [
         {
            name: 'eternal',
            discord_id: '282595588950982656',
         }
      ],
      version: '1.0.0',
      description: "Bypass discord's NSFW age gate.",
      github: 'https://github.com/slow/better-discord-plugins/tree/master/NSFWGateBypass/NSFWGateBypass.plugin.js',
      github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/NSFWGateBypass/NSFWGateBypass.plugin.js',
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
   const { Patcher, WebpackModules } = API;

   return class NSFWGateBypass extends Plugin {
      constructor() {
         super();
      }

      start() {
         let UserModule = WebpackModules.getByProps('getCurrentUser');
         Patcher.after(UserModule, 'getCurrentUser', (_, args, res) => {
            if (res.nsfwAllowed == false) res.nsfwAllowed = true;
         });
      };

      stop() {
         Patcher.unpatchAll();
      };
   };
})(global.ZeresPluginLibrary.buildPlugin(config));