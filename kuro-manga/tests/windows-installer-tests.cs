using System;
using System.IO;
using System.Reflection;
using Kuro.Native;

public class InstallerTests {
    static int checks;
    static void Check(bool value, string name) { if (!value) throw new Exception(name); checks++; Console.WriteLine("PASS: " + name); }
    static void Reject(Action action, string name) { bool rejected=false; try { action(); } catch (InvalidOperationException) { rejected=true; } Check(rejected,name); }
    public static int Main(string[] args) {
        string sandbox=Path.Combine(Path.GetTempPath(), "kuro-installer-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(sandbox);
        try {
            var paths=new InstallPaths(Path.Combine(sandbox,"Programs"),Path.Combine(sandbox,"Start"),Path.Combine(sandbox,"Desktop"));
            byte[] exe=File.ReadAllBytes(args[0]);
            Check(LaunchSettings.Url=="https://kuro-manga.vercel.app/?kuro-native=windows", "fixed production HTTPS app address");
            Check(LaunchSettings.Arguments.StartsWith("--app=https://kuro-manga.vercel.app/") && !LaunchSettings.Arguments.Contains("disable-web-security"), "safe Edge app arguments without security bypass");
            Check(paths.Shortcuts(false).Length==1&&paths.Shortcuts(false)[0]==paths.StartShortcut,"declining the desktop shortcut excludes that path from installation changes");
            Check(paths.Shortcuts(true).Length==2,"desktop shortcut choice adds only the two known shortcut paths");
            Reject(()=>InstallFiles.EnsureSafeDirectory(Path.Combine(sandbox,"Other"),paths.ProgramsDirectory),"outside application directory rejected");
            Reject(()=>InstallFiles.Install(paths,new byte[]{0,1},exe),"non-EXE payload rejected before writing");
            Check(!Directory.Exists(paths.ApplicationDirectory),"invalid payload creates no app directory");
            InstallFiles.Install(paths,exe,exe);
            Check(File.Exists(paths.Launcher) && File.Exists(paths.Uninstaller) && File.Exists(paths.Marker),"actual installer payloads and ownership marker are written");
            Check(File.ReadAllBytes(paths.Launcher).Length==exe.Length,"installed launcher bytes are preserved");
            InstallFiles.Install(paths,exe,exe);
            Check(File.Exists(paths.Launcher),"reinstallation succeeds in owned directory");
            string note=Path.Combine(paths.ApplicationDirectory,"reader-notes.txt"); File.WriteAllText(note,"keep me");
            InstallFiles.Remove(paths);
            Check(!File.Exists(paths.Launcher) && !File.Exists(paths.Uninstaller) && !File.Exists(paths.Marker),"uninstall removes only known application files");
            Check(File.ReadAllText(note)=="keep me","uninstall preserves unrelated user files");
            Reject(()=>InstallFiles.Install(paths,exe,exe),"unowned nonempty directory is not overwritten");
            Check(File.ReadAllText(note)=="keep me","rejected installation preserves existing files");
            File.Delete(note); Directory.Delete(paths.ApplicationDirectory);
            InstallFiles.Install(paths,exe,exe);
            File.SetAttributes(paths.Uninstaller,FileAttributes.ReadOnly);
            try { InstallFiles.Remove(paths); } catch(IOException) {} catch(UnauthorizedAccessException) {}
            Check(File.Exists(paths.Launcher)&&File.Exists(paths.Marker),"locked uninstall retains application files and ownership for retry");
            File.SetAttributes(paths.Uninstaller,FileAttributes.Normal);
            MethodInfo installIntegrated=typeof(InstallFiles).GetMethod("InstallIntegrated");
            Check(installIntegrated!=null,"integrated installation transaction is implemented");
            string startState=Path.Combine(sandbox,"fake-shortcut.txt"); File.WriteAllText(startState,"original shortcut");
            byte[] before=File.ReadAllBytes(paths.Launcher);
            bool failed=false;
            try { installIntegrated.Invoke(null,new object[]{paths,exe,exe,new Action(()=>{File.WriteAllText(startState,"changed");throw new IOException("controlled shortcut failure");}),new Action(()=>File.WriteAllText(startState,"original shortcut"))}); }
            catch(TargetInvocationException) {failed=true;}
            Check(failed&&File.ReadAllText(startState)=="original shortcut"&&Convert.ToBase64String(File.ReadAllBytes(paths.Launcher))==Convert.ToBase64String(before),"failed upgrade restores prior payload and integration state");
            MethodInfo removeIntegrated=typeof(InstallFiles).GetMethod("RemoveIntegrated");
            Check(removeIntegrated!=null,"integrated uninstall transaction is implemented");
            failed=false;
            try { removeIntegrated.Invoke(null,new object[]{paths,new Action(()=>{File.WriteAllText(startState,"removed");throw new IOException("controlled registry failure");}),new Action(()=>File.WriteAllText(startState,"original shortcut"))}); }
            catch(TargetInvocationException) {failed=true;}
            Check(failed&&InstallFiles.Owned(paths)&&File.Exists(paths.Launcher)&&File.ReadAllText(startState)=="original shortcut","failed integration removal restores the owned installation for retry");
            Console.WriteLine(checks+" Windows sandbox checks passed; no registry, shortcut or system installation writes."); return 0;
        } catch(Exception e) { Console.Error.WriteLine(e.Message); return 1; }
        finally { foreach(string file in Directory.GetFiles(sandbox,"*",SearchOption.AllDirectories)) { File.SetAttributes(file,FileAttributes.Normal); File.Delete(file); } Directory.Delete(sandbox,true); }
    }
}
