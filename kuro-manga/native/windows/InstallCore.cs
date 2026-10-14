using System;
using System.IO;
using System.Collections.Generic;

namespace Kuro.Native {
    public static class LaunchSettings {
        public const string Version="3.9.0";
        public const string Url="https://kuro-manga.vercel.app/?kuro-native=windows";
        public const string Arguments="--app="+Url+" --no-first-run";
    }
    public sealed class InstallPaths {
        public readonly string ProgramsDirectory,ApplicationDirectory,StartDirectory,DesktopDirectory;
        public InstallPaths(string programs,string start,string desktop) {
            ProgramsDirectory=Path.GetFullPath(programs); ApplicationDirectory=Path.Combine(ProgramsDirectory,"KURO");
            StartDirectory=Path.GetFullPath(start); DesktopDirectory=Path.GetFullPath(desktop);
        }
        public string Launcher { get { return Path.Combine(ApplicationDirectory,"Kuro.exe"); } }
        public string Uninstaller { get { return Path.Combine(ApplicationDirectory,"KuroUninstall.exe"); } }
        public string Marker { get { return Path.Combine(ApplicationDirectory,"kuro-install.txt"); } }
        public string StartShortcut { get { return Path.Combine(StartDirectory,"KURO.lnk"); } }
        public string DesktopShortcut { get { return Path.Combine(DesktopDirectory,"KURO.lnk"); } }
        public string[] Shortcuts(bool desktop) { return desktop?new[]{StartShortcut,DesktopShortcut}:new[]{StartShortcut}; }
        public static InstallPaths Current() {
            return new InstallPaths(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs"),
                Environment.GetFolderPath(Environment.SpecialFolder.Programs),Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory));
        }
    }
    public static class InstallFiles {
        public const string Ownership="KURO_WINDOWS_INSTALL_V1\nhttps://kuro-manga.vercel.app\n";
        public static void EnsureNoReparse(string path) {
            for(string current=Path.GetFullPath(path); !String.IsNullOrEmpty(current); current=Path.GetDirectoryName(current)) {
                if ((Directory.Exists(current)||File.Exists(current)) && (File.GetAttributes(current)&FileAttributes.ReparsePoint)!=0)
                    throw new InvalidOperationException("KURO cannot install through a linked or redirected directory.");
                if(current==Path.GetPathRoot(current)) break;
            }
        }
        public static void EnsureSafeDirectory(string directory,string programs) {
            string expected=Path.Combine(Path.GetFullPath(programs),"KURO");
            if(!String.Equals(Path.GetFullPath(directory),expected,StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Unexpected installation directory.");
            EnsureNoReparse(directory);
        }
        static void Validate(InstallPaths paths) {
            EnsureSafeDirectory(paths.ApplicationDirectory,paths.ProgramsDirectory);
            foreach(string file in new[]{paths.Launcher,paths.Uninstaller,paths.Marker}) EnsureNoReparse(file);
        }
        static void Exe(byte[] data) {
            if(data==null||data.Length<128||data[0]!=77||data[1]!=90) throw new InvalidOperationException("Invalid KURO application payload.");
            int offset=BitConverter.ToInt32(data,60);
            if(offset<64||offset>data.Length-4||data[offset]!=80||data[offset+1]!=69||data[offset+2]!=0||data[offset+3]!=0)
                throw new InvalidOperationException("Invalid KURO application payload.");
        }
        public static bool Owned(InstallPaths paths) {
            Validate(paths); return File.Exists(paths.Marker)&&File.ReadAllText(paths.Marker)==Ownership;
        }
        static void Write(string file,byte[] data) {
            EnsureNoReparse(file);
            string temp=file+"."+Guid.NewGuid().ToString("N")+".tmp";
            try {
                File.WriteAllBytes(temp,data);
                if(File.Exists(file)) File.Replace(temp,file,null); else File.Move(temp,file);
            } finally { if(File.Exists(temp)) File.Delete(temp); }
        }
        public static void Install(InstallPaths paths,byte[] launcher,byte[] uninstaller) {
            Exe(launcher); Exe(uninstaller); Validate(paths);
            if(Directory.Exists(paths.ApplicationDirectory)&&Directory.GetFileSystemEntries(paths.ApplicationDirectory).Length>0&&!Owned(paths))
                throw new InvalidOperationException("The KURO installation folder contains unrelated files. Choose a clean account installation location.");
            var backups=new Dictionary<string,byte[]>();
            foreach(string file in new[]{paths.Launcher,paths.Uninstaller,paths.Marker}) backups[file]=File.Exists(file)?File.ReadAllBytes(file):null;
            Directory.CreateDirectory(paths.ApplicationDirectory);
            try {
                Write(paths.Launcher,launcher); Write(paths.Uninstaller,uninstaller);
                Write(paths.Marker,System.Text.Encoding.UTF8.GetBytes(Ownership));
            } catch {
                foreach(var item in backups) {
                    EnsureNoReparse(item.Key);
                    if(item.Value==null) { if(File.Exists(item.Key)) File.Delete(item.Key); }
                    else Write(item.Key,item.Value);
                }
                if(Directory.GetFileSystemEntries(paths.ApplicationDirectory).Length==0) Directory.Delete(paths.ApplicationDirectory);
                throw;
            }
        }
        static Dictionary<string,byte[]> Snapshot(InstallPaths paths) {
            Validate(paths); var result=new Dictionary<string,byte[]>();
            foreach(string file in new[]{paths.Launcher,paths.Uninstaller,paths.Marker}) result[file]=File.Exists(file)?File.ReadAllBytes(file):null;
            return result;
        }
        static void Restore(InstallPaths paths,Dictionary<string,byte[]> before) {
            Validate(paths);
            foreach(var item in before) {
                EnsureNoReparse(item.Key);
                if(item.Value==null) { if(File.Exists(item.Key)) File.Delete(item.Key); }
                else {
                    // A locked/read-only unchanged payload must remain untouched.
                    if(File.Exists(item.Key)&&Convert.ToBase64String(File.ReadAllBytes(item.Key))==Convert.ToBase64String(item.Value)) continue;
                    Directory.CreateDirectory(paths.ApplicationDirectory); Write(item.Key,item.Value);
                }
            }
            if(Directory.Exists(paths.ApplicationDirectory)&&Directory.GetFileSystemEntries(paths.ApplicationDirectory).Length==0) Directory.Delete(paths.ApplicationDirectory);
        }
        static void Integrated(InstallPaths paths,Action files,Action integration,Action undoIntegration) {
            var before=Snapshot(paths); bool integrationStarted=false;
            try { files(); integrationStarted=true; integration(); }
            catch(Exception error) {
                Exception rollback=null;
                if(integrationStarted) { try { undoIntegration(); } catch(Exception undo) { rollback=undo; } }
                try { Restore(paths,before); } catch(Exception undo) { rollback=undo; }
                if(rollback!=null) throw new InvalidOperationException("KURO could not finish or fully restore the operation. Retry the installer after checking file permissions.",error);
                throw;
            }
        }
        public static void InstallIntegrated(InstallPaths paths,byte[] launcher,byte[] uninstaller,Action integration,Action undoIntegration) {
            Integrated(paths,()=>Install(paths,launcher,uninstaller),integration,undoIntegration);
        }
        public static void RemoveIntegrated(InstallPaths paths,Action integration,Action undoIntegration) {
            Integrated(paths,()=>Remove(paths),integration,undoIntegration);
        }
        public static void Remove(InstallPaths paths) {
            if(!Owned(paths)) throw new InvalidOperationException("A KURO-owned installation was not found.");
            var before=Snapshot(paths);
            try {
                foreach(string file in new[]{paths.Launcher,paths.Uninstaller,paths.Marker}) { EnsureNoReparse(file); if(File.Exists(file)) File.Delete(file); }
                if(Directory.GetFileSystemEntries(paths.ApplicationDirectory).Length==0) Directory.Delete(paths.ApplicationDirectory);
            } catch { Restore(paths,before); throw; }
        }
    }
}
