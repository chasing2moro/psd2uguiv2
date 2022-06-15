using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

public class PSDDispatchWindow: EditorWindow
{


    public void ShowExternal()
    {
        this._dispatcher = new PSDDispatchRes();
        this._dispatcher.Dispatch();

        _name2TextureOld = new Dictionary<string, Texture>();
        foreach (var vImageSpriteName in _dispatcher.name2pathOld.Keys)
        {
            _name2TextureOld[vImageSpriteName] = AssetDatabase.LoadAssetAtPath<Texture>(_dispatcher.name2pathOld[vImageSpriteName]);
        }

        _name2TextureNew = new Dictionary<string, TextureNewInfo>();
        foreach (var vImageSpriteName in _dispatcher.name2pathNew.Keys)
        {
            var texture = AssetDatabase.LoadAssetAtPath<Texture>(_dispatcher.name2pathNew[vImageSpriteName]);
            if (texture != null)
                _name2TextureNew[vImageSpriteName] = new TextureNewInfo(texture);
        }
        this.Show();
    }

    private PSDDispatchRes _dispatcher;
    private Dictionary<string, Texture> _name2TextureOld;
    private Dictionary<string, TextureNewInfo> _name2TextureNew;
    private bool _isSetAnchor = false;
    private bool _isDispatch = false;
    public class TextureNewInfo
    {
        public Texture texture;
        public bool isMove;
        public TextureNewInfo(Texture vTexture)
        {
            texture = vTexture;
            isMove = false;
        }
    }
    private Vector2 _scrollVewiPos;
    private void OnGUI()
    {
        _scrollVewiPos = EditorGUILayout.BeginScrollView(_scrollVewiPos);
        foreach (var vImageSpriteName in _dispatcher.name2pathOld.Keys)
        {

            Texture textureOld;
            TextureNewInfo textureNew;
            _name2TextureNew.TryGetValue(vImageSpriteName, out textureNew);

            //上边
            string pathNew;
            if (!_dispatcher.name2pathNew.TryGetValue(vImageSpriteName, out pathNew))
                pathNew = "找不到路径";
            else
                pathNew = pathNew.Replace(PSDDispatchRes.AtlasDir, "");
            if (textureNew == null)
            {
                GUILayout.Label("新图片生成:" + pathNew);
            }
            else
            {
                GUILayout.Label("旧图片覆盖:" + pathNew);
            }

            EditorGUILayout.BeginHorizontal();

            //左边
            if (_name2TextureOld.TryGetValue(vImageSpriteName, out textureOld))
                EditorGUILayout.ObjectField(" ", textureOld, typeof(Texture), false);

            //右边
            if (textureNew == null)
            {
                GUI.enabled = false;
                EditorGUILayout.ObjectField(" ", null, typeof(Texture), false);
                EditorGUILayout.Toggle(false);
                GUI.enabled = true;
            }
            else
            {
                EditorGUILayout.ObjectField("替换", textureNew.texture, typeof(Texture), false);
                textureNew.isMove = EditorGUILayout.Toggle(textureNew.isMove);
            }
            
            EditorGUILayout.EndHorizontal();
        }
        EditorGUILayout.EndScrollView();

        GUILayout.BeginHorizontal();
        if (!_isSetAnchor && GUILayout.Button("SetAnchor(使用PSD的锚点)"))
        {
            new PSDAnchorMaker().SetAllAnchors();
            _isSetAnchor = true;
        }
        if (!_isDispatch)
        {
            if (GUILayout.Button("Dispatch"))
            {
                Dispatch();
                _isDispatch = true;
            }
        }
        else
        {
            GUILayout.Label("Dispatch Finish.You can close me now, if without a single error");
            if (GUILayout.Button("Delete All PSD Resource"))
            {
                var dir = GetPSDDirRoot();
                if(dir != null)
                {
                    var delFiles = Directory.GetFiles(dir);
                    foreach (var delFile in delFiles)
                    {
                        File.Delete(delFile);
                    }
                    //Directory.Delete(dir, true);
                   // Directory.CreateDirectory(dir);//美术需要再此目录上次
                }
                AssetDatabase.Refresh();
                Debug.Log("Delete finished");
            }
        }
        GUILayout.EndHorizontal();
    }

    public void Dispatch()
    {
        _dispatcher.nameNoMove = new HashSet<string>();
        foreach (var vImageSpriteName in _name2TextureNew.Keys)
        {
            var textureNewInfo = _name2TextureNew[vImageSpriteName];
            if (!textureNewInfo.isMove)
            {
                _dispatcher.nameNoMove.Add(vImageSpriteName);
                PSDDispatchRes.Log("<color=red>不覆盖图片:</color>" + AssetDatabase.GetAssetPath(textureNewInfo.texture));
            }
        }
        _dispatcher.DoAction();//广州寰宇添加
    }

    public string GetPSDDirRoot()
    {
        string dir = null;
        foreach (var texture in _name2TextureOld.Values)
        {
            var path = AssetDatabase.GetAssetPath(texture);
            dir = Path.GetDirectoryName(path);
            if (Directory.Exists(dir))
                break;
            Debug.LogError("Can not find dir:" + dir);
        }
        return dir;
    }
}

