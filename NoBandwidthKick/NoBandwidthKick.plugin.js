/**
 * @name NoBandwidthKick
 * @description Stops discord from disconnecting you when you're in a call alone for more than 5 minutes.
 * @version 2.0.0
 * @source https://github.com/slow/better-discord-plugins/blob/master/NoBandwidthKick/NoBandwidthKick.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/NoBandwidthKick/NoBandwidthKick.plugin.js
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

const { findModuleByProps, Patcher } = BdApi;
const { Timeout } = findModuleByProps('Timeout');

class NoBandwidthKick {
   start() {
      Patcher.after('no-bandwidth-kick', Timeout.prototype, 'start', (instance, args) => {
         if (args[1]?.toString().includes('BOT_CALL_IDLE_DISCONNECT')) {
            instance.stop();
         };
      });
   }

   stop() {
      Patcher.unpatchAll('no-bandwidth-kick');
   }
};
