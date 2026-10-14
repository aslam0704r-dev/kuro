using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using Microsoft.Win32;
namespace Kuro.Native {
    public static class DesktopIntegration {
        const string RegistryPath="Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KURO";
        static object Shell() { return Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell",true)); }
        static object Shortcut(object shell,string file) { return shell.GetType().InvokeMember("CreateShortcut",BindingFlags.InvokeMethod,null,shell,new object[]{file}); }
        static object Get(object shortcut,string name) { return shortcut.GetType().InvokeMember(name,BindingFlags.GetProperty,null,shortcut,null); }
        static void Set(object shortcut,string name,string value) { shortcut.GetType().InvokeMember(name,BindingFlags.SetProperty,null,shortcut,new object[]{value}); }
        static bool OwnShortcut(string file,string target) {
            if(!File.Exists(file)) return false;
            InstallFiles.EnsureNoReparse(file); object shell=null,shortcut=null;
            try { shell=Shell(); shortcut=Shortcut(shell,file); return String.Equals(Convert.ToString(Get(shortcut,"TargetPath")),target,StringComparison.OrdinalIgnoreCase); }
            finally { if(shortcut!=null) Marshal.FinalReleaseComObject(shortcut); if(shell!=null) Marshal.FinalReleaseComObject(shell); }
        }
        static void CreateShortcut(string file,string target) {
            InstallFiles.EnsureNoReparse(file);
            if(File.Exists(file)&&!OwnShortcut(file,target)) throw new InvalidOperationException("A shortcut named KURO already belongs to another application.");
            Directory.CreateDirectory(Path.GetDirectoryName(file)); object shell=null,shortcut=null;
            try {
                shell=Shell(); shortcut=Shortcut(shell,file); Set(shortcut,"TargetPath",target); Set(shortcut,"WorkingDirectory",Path.GetDirectoryName(target));
                Set(shortcut,"Description","KURO — Manga & Manhwa Reader"); Set(shortcut,"IconLocation",target+",0");
                shortcut.GetType().InvokeMember("Save",BindingFlags.InvokeMethod,null,shortcut,null);
            } finally { if(shortcut!=null) Marshal.FinalReleaseComObject(shortcut); if(shell!=null) Marshal.FinalReleaseComObject(shell); }
        }
        public static void Check(InstallPaths paths,bool desktop) {
            foreach(string file in paths.Shortcuts(desktop)) {
                InstallFiles.EnsureNoReparse(file); if(File.Exists(file)&&!OwnShortcut(file,paths.Launcher)) throw new InvalidOperationException("A shortcut named KURO already belongs to another application.");
            }
            using(var key=Registry.CurrentUser.OpenSubKey(RegistryPath)) {
                if(key!=null&&key.SubKeyCount!=0) throw new InvalidOperationException("The KURO uninstall entry contains unexpected subkeys.");
                if(key!=null&&!String.Equals(Convert.ToString(key.GetValue("InstallLocation")),paths.ApplicationDirectory,StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("An unrelated KURO uninstall entry already exists.");
            }
        }
        public static Action Snapshot(InstallPaths paths,bool desktop,bool removing=false) {
            var files=new Dictionary<string,byte[]>();
            foreach(string file in paths.Shortcuts(desktop)) {
                InstallFiles.EnsureNoReparse(file);
                if(File.Exists(file)&&!OwnShortcut(file,paths.Launcher)) { if(removing) continue; throw new InvalidOperationException("A shortcut named KURO already belongs to another application."); }
                files[file]=File.Exists(file)?File.ReadAllBytes(file):null;
            }
            var values=new Dictionary<string,object>(); var kinds=new Dictionary<string,RegistryValueKind>(); bool existing,owned;
            using(var key=Registry.CurrentUser.OpenSubKey(RegistryPath)) {
                existing=key!=null;
                owned=key==null||String.Equals(Convert.ToString(key.GetValue("InstallLocation")),paths.ApplicationDirectory,StringComparison.OrdinalIgnoreCase);
                if(key!=null&&owned) foreach(string name in key.GetValueNames()) { values[name]=key.GetValue(name,null,RegistryValueOptions.DoNotExpandEnvironmentNames); kinds[name]=key.GetValueKind(name); }
            }
            return ()=> {
                foreach(var item in files) {
                    InstallFiles.EnsureNoReparse(item.Key);
                    if(File.Exists(item.Key)&&!OwnShortcut(item.Key,paths.Launcher)) throw new InvalidOperationException("An unrelated shortcut must not be overwritten during recovery.");
                    if(item.Value==null) { if(File.Exists(item.Key)) File.Delete(item.Key); }
                    else { Directory.CreateDirectory(Path.GetDirectoryName(item.Key)); File.WriteAllBytes(item.Key,item.Value); }
                }
                if(!owned) return;
                using(var current=Registry.CurrentUser.OpenSubKey(RegistryPath)) {
                    bool emptyNew=current!=null&&!existing&&current.ValueCount==0&&current.SubKeyCount==0;
                    if(current!=null&&!emptyNew&&!String.Equals(Convert.ToString(current.GetValue("InstallLocation")),paths.ApplicationDirectory,StringComparison.OrdinalIgnoreCase))
                        throw new InvalidOperationException("An unrelated uninstall entry must not be overwritten during recovery.");
                }
                if(!existing) Registry.CurrentUser.DeleteSubKey(RegistryPath,false);
                else using(var key=Registry.CurrentUser.CreateSubKey(RegistryPath)) {
                    foreach(string name in key.GetValueNames()) if(!values.ContainsKey(name)) key.DeleteValue(name,false);
                    foreach(var item in values) key.SetValue(item.Key,item.Value,kinds[item.Key]);
                }
            };
        }
        public static void Add(InstallPaths paths,bool desktop) {
            CreateShortcut(paths.StartShortcut,paths.Launcher); if(desktop) CreateShortcut(paths.DesktopShortcut,paths.Launcher);
            using(var key=Registry.CurrentUser.CreateSubKey(RegistryPath)) {
                // Set ownership before optional display values, so a partial write
                // can be recognized and rolled back without touching another app.
                key.SetValue("InstallLocation",paths.ApplicationDirectory);
                key.SetValue("DisplayName","KURO"); key.SetValue("DisplayVersion",LaunchSettings.Version); key.SetValue("Publisher","KURO");
                key.SetValue("DisplayIcon",paths.Launcher); key.SetValue("URLInfoAbout","https://kuro-manga.vercel.app/");
                key.SetValue("UninstallString","\""+paths.Uninstaller+"\" --uninstall"); key.SetValue("NoModify",1,RegistryValueKind.DWord); key.SetValue("NoRepair",1,RegistryValueKind.DWord);
            }
        }
        public static void Remove(InstallPaths paths) {
            foreach(string file in new[]{paths.StartShortcut,paths.DesktopShortcut}) if(OwnShortcut(file,paths.Launcher)) File.Delete(file);
            using(var key=Registry.CurrentUser.OpenSubKey(RegistryPath)) {
                if(key==null||!String.Equals(Convert.ToString(key.GetValue("InstallLocation")),paths.ApplicationDirectory,StringComparison.OrdinalIgnoreCase)) return;
            }
            Registry.CurrentUser.DeleteSubKey(RegistryPath,false);
        }
    }
    public sealed class SetupWindow:Form {
        readonly CheckBox desktop=new CheckBox(); readonly Button install=new Button(); readonly Label message=new Label(); bool complete;
        public SetupWindow() {
            Text="Install KURO"; ClientSize=new Size(490,385); FormBorderStyle=FormBorderStyle.FixedDialog; MaximizeBox=false;
            StartPosition=FormStartPosition.CenterScreen; BackColor=Color.FromArgb(17,15,12); ForeColor=Color.FromArgb(243,236,223); AutoScaleMode=AutoScaleMode.Dpi;
            Icon=Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            Controls.Add(new Label{Text="KURO",Font=new Font("Segoe UI",32,FontStyle.Bold),ForeColor=Color.FromArgb(225,189,132),Location=new Point(30,22),AutoSize=true});
            Controls.Add(new Label{Text="Your next chapter. On your desktop.",Font=new Font("Segoe UI",13),Location=new Point(34,94),AutoSize=true});
            Controls.Add(new Label{Text="Install KURO for this Windows account.\nRead, sign in and edit your profile in a dedicated app window.\nInternet access and Microsoft Edge are required.",Font=new Font("Segoe UI",10),Location=new Point(34,138),Size=new Size(425,72)});
            desktop.Text="Create a desktop shortcut"; desktop.Checked=true; desktop.Font=new Font("Segoe UI",10); desktop.Location=new Point(34,222); desktop.Size=new Size(350,30); Controls.Add(desktop);
            message.Font=new Font("Segoe UI",9); message.Location=new Point(34,263); message.Size=new Size(425,45); Controls.Add(message);
            install.Text="Install KURO"; install.Font=new Font("Segoe UI",11,FontStyle.Bold); install.BackColor=Color.FromArgb(225,189,132); install.ForeColor=Color.FromArgb(20,16,11);
            install.FlatStyle=FlatStyle.Flat; install.Location=new Point(34,318); install.Size=new Size(422,43); install.Click+=ClickInstall; Controls.Add(install);
        }
        void ClickInstall(object sender,EventArgs e) {
            if(complete) { try { EdgeHost.Open(); Close(); } catch(Exception error) { message.Text=error.Message; } return; }
            install.Enabled=false;
            try {
                if(EdgeHost.Find()==null) throw new InvalidOperationException("Install Microsoft Edge before installing KURO.");
                var paths=InstallPaths.Current(); DesktopIntegration.Check(paths,desktop.Checked);
                byte[] launcher;
                using(Stream stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("KuroLauncher")) { using(var memory=new MemoryStream()) { stream.CopyTo(memory); launcher=memory.ToArray(); } }
                Action restore=DesktopIntegration.Snapshot(paths,desktop.Checked);
                InstallFiles.InstallIntegrated(paths,launcher,File.ReadAllBytes(Application.ExecutablePath),()=>DesktopIntegration.Add(paths,desktop.Checked),restore);
                complete=true; desktop.Enabled=false; message.Text="KURO is installed. You can also open it from Start."; install.Text="Open KURO";
            } catch(Exception error) { message.Text="Installation could not finish: "+error.Message; }
            finally { install.Enabled=true; }
        }
    }
    public static class Installer {
        [STAThread] public static int Main(string[] args) {
            Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
            try {
                if(args.Length==1&&args[0]=="--uninstall") {
                    string directory=Path.Combine(Path.GetTempPath(),"KURO-Uninstall-"+Guid.NewGuid().ToString("N")); Directory.CreateDirectory(directory);
                    string temporary=Path.Combine(directory,"KuroUninstall.exe"); File.Copy(Application.ExecutablePath,temporary);
                    Process.Start(new ProcessStartInfo(temporary,"--remove-installed"){UseShellExecute=false}); return 0;
                }
                if(args.Length==1&&args[0]=="--remove-installed") {
                    if(MessageBox.Show("Remove KURO from this Windows account? Your browser's reading data will remain available.","Uninstall KURO",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes) return 0;
                    var paths=InstallPaths.Current(); if(!InstallFiles.Owned(paths)) throw new InvalidOperationException("A KURO installation was not found.");
                    Action restore=DesktopIntegration.Snapshot(paths,true,true);
                    InstallFiles.RemoveIntegrated(paths,()=>DesktopIntegration.Remove(paths),restore); MessageBox.Show("KURO has been removed.","KURO"); return 0;
                }
                if(args.Length!=0) throw new InvalidOperationException("Unsupported installer arguments.");
                Application.Run(new SetupWindow()); return 0;
            } catch(Exception error) { MessageBox.Show(error.Message,"KURO",MessageBoxButtons.OK,MessageBoxIcon.Information); return 1; }
        }
    }
}
