using System;
using UnityEditor;
using UnityEngine;

namespace PSDUIImporter
{
    //------------------------------------------------------------------------------
    // class definition
    //------------------------------------------------------------------------------
    public class PSDImportMenu : Editor
    {
        [MenuItem("QuickTool/PSDImport ...", false, 1)]
        static public void ImportPSD()
        {
            string inputFile = EditorUtility.OpenFilePanel("Choose PSDUI File to Import", Application.dataPath, "xml");

            if (!string.IsNullOrEmpty(inputFile) &&
                inputFile.StartsWith(Application.dataPath))
            {
                PSDImporterConst.LoadConfig();  //重载wizard配置

                PSDImportCtrl import = new PSDUIImporter.PSDImportCtrl(inputFile);
                import.BeginDrawUILayers();
                import.BeginSetUIParents();

                //广州寰宇添加 图片分发
                var window = (PSDDispatchWindow)EditorWindow.GetWindow(typeof(PSDDispatchWindow));
                window.ShowExternal();

                //广州寰宇添加 预设添加
                new PSDPrefabMaker().SetAllPrefab();
            }

            GC.Collect();
        }
    }
}