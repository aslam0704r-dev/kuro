using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Reflection;
[assembly:AssemblyVersion("3.9.0.0")]
[assembly:AssemblyFileVersion("3.9.0.0")]
[assembly:AssemblyProduct("KURO")]
namespace Kuro.Native {
    public static class EdgeHost {
        public static string Find() {
            foreach(string root in new[]{Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)}) {
                if(String.IsNullOrEmpty(root)) continue;
                string file=Path.Combine(root,"Microsoft","Edge","Application","msedge.exe");
                if(File.Exists(file)) return file;
            }
            return null;
        }
        public static void Open() {
            string executable=Find();
            if(executable==null) throw new InvalidOperationException("Microsoft Edge is required to run KURO. Install or update Edge, then open KURO again.");
            Process.Start(new ProcessStartInfo(executable,LaunchSettings.Arguments){UseShellExecute=false});
        }
    }
    public static class Launcher {
        [STAThread] public static int Main(string[] args) {
            try { EdgeHost.Open(); return 0; }
            catch(Exception error) { MessageBox.Show(error.Message,"KURO",MessageBoxButtons.OK,MessageBoxIcon.Information); return 1; }
        }
    }
}
