using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;


public class PSDCopyScript : EditorWindow
{

    [MenuItem("QuickTool/PSDCopyScript")]
    public static void OpenWindow()
    {
        var window = EditorWindow.GetWindow(typeof(PSDCopyScript)) as PSDCopyScript;
        window.Show();
    }

    private string psdScriptPath;

    private void Awake()
    {
        RecoverValue();
    }
    private void OnGUI()
    {
        psdScriptPath = EditorGUILayout.TextField("PSD Script Path", psdScriptPath);
        if (GUILayout.Button("Copy"))
        {
            //Unity jsx文件
            var fileName = "ExportPSDUI.jsx";
            var srcPath = Path.Combine(Application.dataPath, "PSDTool/Custom/JSCode/" + fileName);
            var dstPath = psdScriptPath;
            if (!File.Exists(srcPath))
            {
                Debug.LogError("Can not find:" + srcPath);
                return;
            }

            //Photo Shop jsx文件
            if (!Directory.Exists(dstPath))
            {
                Debug.LogError("Can not find:" + dstPath);
                return;
            }
            var dstFile = Path.Combine(dstPath, fileName);
            File.Copy(srcPath, dstFile, true);

            //保存变量
            SaveValue();

            Debug.Log("Copy Finish");
            Debug.Log("Use Method:2.	打开一个psd文件，在ps中选择“文件->脚本->Export PSDUI”，会弹框选择一个目录，存放切图和配置文件即可。");
        }
    }

    private void SaveValue()
    {
        EditorPrefs.SetString("psdScriptPath", psdScriptPath);
    }

    private void RecoverValue()
    {
        psdScriptPath = EditorPrefs.GetString("psdScriptPath", "C:/Program Files/Adobe/Adobe Photoshop CC 2017/Presets/Scripts");
    }
}

