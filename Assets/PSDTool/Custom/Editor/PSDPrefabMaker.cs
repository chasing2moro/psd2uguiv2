using PSDUIImporter;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

public class PSDPrefabMaker
{
    public const string reusePrefabDir = @"Assets\CustomAssets\Arts\_Resources\UI\AAACommon";
    public Dictionary<string, string> reusePrefabName2Path;

    public PSDPrefabMaker()
    {
        reusePrefabName2Path = new Dictionary<string, string>();
        var guids = AssetDatabase.FindAssets("t:prefab", new string[] { reusePrefabDir });
        foreach (var guid in guids)
        {
            var assetPath = AssetDatabase.GUIDToAssetPath(guid);
            reusePrefabName2Path.Add(Path.GetFileNameWithoutExtension(assetPath), assetPath);
        }
    }
    public void SetAllPrefab()
    {
        var root = PSDDispatchRes.GetRootUI();
        var rects = root.GetComponentsInChildren<RectTransform>();
        foreach (var rect in rects)
        {
            SetPrefab(rect);
        }
    }

    private void SetPrefab(RectTransform obj)
    {
        //广州寰宇添加 2022-5-27
        if (reusePrefabName2Path.TryGetValue(obj.name, out string assetPath))
        {
            var asset = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if(asset == null)
            {
                Debug.LogError(assetPath + " Can not load");
                return;
            }
            var go = PrefabUtility.InstantiateAttachedAsset(asset) as GameObject;
            go.name = asset.name;
            go.GetRectTransform().SetParent(obj, false);
            PrefabUtility.ConnectGameObjectToPrefab(go, asset);
        }
        
    }
}

