using PSDUIImporter;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;

public class PSDDispatchRes
{
    private const string DirSeparator = "+";
    private const string SpritesDir = "Sprites/";
    public static string AtlasDir = "Assets/CustomAssets/Arts/_Dependencies/";
    public static string[] atlasArray = new string[] { "UIAtlas", "UIBigImage", "UIBigLoadAtlas", "UILoadAtlas" };
    public static bool IsUIAtlasRoot(string fileName)
    {
        for (int i = 1; i < atlasArray.Length; i++)
        {
            if (fileName.StartsWith(atlasArray[i]))
                return false;
        }
        return true;
    }
    //name 是xml 当前路径下 图片的名字，绝对是唯一的
    //name 是 image.sprite.name
    private Dictionary<Image, string> _image2name;
    private Dictionary<string, string> _name2pathOld;
    private Dictionary<string, string> _name2pathNew;
    public HashSet<string> nameNoMove; //这个图片不要移动

    public Dictionary<Image, string> image2name
    {
        get { return _image2name; }
    }

    public Dictionary<string, string> name2pathOld
    {
        get { return _name2pathOld; }
    }
    public Dictionary<string, string> name2pathNew
    {
        get { return _name2pathNew; }
    }
    private GameObject _rootObj;
    private Dictionary<string, string> _allImageName2Path;


    public List<Image> GetImagesByName(string name)
    {
        List<Image> images = new List<Image>();
        foreach (var image in _image2name.Keys)
        {
            if(_image2name[image] == name)
                images.Add(image);
        }
        return images;
    }
    public static void Log(string vLog)
    {
        Debug.Log("<color=green>psd:</color>" + vLog);
    }

    public static GameObject GetRootUI()
    {
        var rootObj = PSDImportUtility.canvas.gameObject;
        if (rootObj.transform.childCount != 1)
        {
            Debug.LogError("存在多个UI,请只保留一个UI");
            return null;
        }

        rootObj = rootObj.transform.GetChild(0).gameObject;
        return rootObj;
    }
    public void Dispatch()
    {
        _allImageName2Path = GetAllImageName2Path();
        _rootObj = GetRootUI();
        if (_rootObj == null)
            return;
        var images = _rootObj.GetComponentsInChildren<Image>(true);

        _image2name = new Dictionary<Image, string>();
        _name2pathOld = new Dictionary<string, string>();
        foreach (var image in images)
        {
            if (image.sprite == null)
            {
                if(!image.name.Contains(PSDImporterConst.SPINE))//2022-5-20 广州寰宇添加 Spine动画不添加
                    Debug.LogError("Can not find sprite :" + image.name);
                continue;
            }
            _image2name[image] = image.sprite.name;
            var path = AssetDatabase.GetAssetPath(image.sprite);

            if (path.Contains("_Dependencies"))
            {
                Debug.LogWarning("直接用了_Dependencies里资源，不用替换:" + path);
                continue;
            }

            _name2pathOld[image.sprite.name] = path;

            Log(image.sprite.name + " path:" + path);
        }

        //生成新的图片
        MakePathNew();


    }

    public void DoAction()
    {
        //移动图片
        MoveFile();

        //图片重新复制Sprite
        AssignSprite();

        AssetDatabase.Refresh();//
    }
    private void MakePathNew()
    {
        _name2pathNew = new Dictionary<string, string>();
        foreach (var name in _name2pathOld.Keys)
        {
            var pathOld = _name2pathOld[name];
            if (pathOld.StartsWith("Resources"))
            {
                var imagesBuiltIn = GetImagesByName(name);
                foreach (var imageBuiltIn in imagesBuiltIn)
                {
                    Debug.LogError("致命bug，请联系李柏祥：Can not Copy built-in path:" + pathOld + " name:" + name, imageBuiltIn.gameObject);
                }
                continue;
            }

            var fileName = Path.GetFileName(pathOld);

            string assetPathGlobal = null;//全局名字查找（1）
            //路径倒数插入 /Sprites/
            if (fileName.Contains(DirSeparator))
            {
                //包含路径的图片
                Debug.LogError("图片包含路径的功能已经废弃：" + fileName);
                fileName = fileName.Replace(DirSeparator, "/");
                fileName = Regex.Replace(fileName, "/([^/]*?$)", "/" + SpritesDir + "$1");
            }
            else
            {
                if (_allImageName2Path.TryGetValue(fileName, out assetPathGlobal))
                {
                    //全局名字查找（2）
                    Debug.Log("<color=yellow>全局名字查找</color>：" + fileName);
                }
                else
                {
                    //当前界面的路径
                    fileName = _rootObj.name + "/" + SpritesDir + fileName;
                }
            }

            string pathNew;
            if (string.IsNullOrEmpty(assetPathGlobal))
            {
                if (IsUIAtlasRoot(fileName))
                    pathNew = AtlasDir + atlasArray[0] + "/" + fileName;//atlasArray[0] 是 "UIAtlas"
                else
                    pathNew = AtlasDir + fileName;// "UIBigImage", "UIBigLoadAtlas", "UILoadAtlas"
            }
            else
            {
                //全局名字查找（2）
                pathNew = assetPathGlobal;
            }


            var dirNew = Path.GetDirectoryName(pathNew);
            if (!Directory.Exists(dirNew))
            {
                Directory.CreateDirectory(dirNew);
                Log("Create :" + dirNew);
            }

            _name2pathNew[name] = pathNew;
        }
    }

    private void MoveFile()
    {
        foreach (var name in _name2pathOld.Keys)
        {
            var pathOld = _name2pathOld[name];
            string pathNew;
            if (!_name2pathNew.TryGetValue(name, out pathNew))
                continue;

            if (nameNoMove.Contains(name))
            {
                Log("<color=red>移动失败:</color>" + pathOld + " to " + pathNew);
                continue;
            }

            File.Copy(pathOld, pathNew, overwrite: true);
            AssetDatabase.Refresh();
            ImportImageAsSprite(pathOld, pathNew);
            Log("移动成功:" + pathOld + " to " + pathNew);
        }
    }

    private void ImportImageAsSprite(string pathOld, string pathNew)
    {
        TextureImporter importerOld = AssetImporter.GetAtPath(pathOld) as TextureImporter;
        if (importerOld == null)
        {
            Debug.LogError("Can not load TextureImporter path:" + pathOld);
            return;
        }

        TextureImporter importerNew = AssetImporter.GetAtPath(pathNew) as TextureImporter;
        if(importerNew == null)
        {
            Debug.LogError("Can not load TextureImporter path:" + pathNew);
            return;
        }
        importerNew.textureType = importerOld.textureType;
        importerNew.spriteImportMode = importerOld.spriteImportMode;
        importerNew.mipmapEnabled = importerOld.mipmapEnabled;
        //新版本Unity已经废弃spritePackingTag
        //importerNew.spritePackingTag = importerOld.spritePackingTag;
        importerNew.maxTextureSize = importerOld.maxTextureSize;
        importerNew.spriteBorder = importerOld.spriteBorder;

        importerNew.SaveAndReimport();
    }

    private  void AssignSprite() {
        foreach (var image in _image2name.Keys)
        {
            var name = _image2name[image];
            string pathNew;
           if(!_name2pathNew.TryGetValue(name, out pathNew))
            {
                //ScrollRect 只需要把内置图片值为空
                if (IsScrollRect(image))
                    continue;

                //Mask 不做任何处理
                if (IsMask(image))
                    continue;

                //如果是Slider的Handle 不做任何处理
                if (IsHandle(image))
                    continue;

                Debug.LogError("Can not find path from _name2pathNew, spriteName:" + name + " image:" + image.name, image.gameObject);
                continue;
            }
            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(pathNew);
            if(sprite == null)
            {
                Debug.LogError("Can not Load Sprite:" + pathNew);
                continue;
            }
            image.sprite = sprite;
        }
        
    }

    private bool IsScrollRect(Image vImage)
    {
        var scrollRect = vImage.GetComponent<ScrollRect>();
        if (scrollRect == null)
            return false;

        vImage.sprite = null;
        vImage.color = Color.clear;
        return true;
    }

    private bool IsMask(Image vImage)
    {
        var mask = vImage.GetComponent<UnityEngine.UI.Mask>();
        return mask != null;
    }

    private bool IsHandle(Image vImage)
    {
        return vImage.name == "Handle";
    }

    //有后缀名的
    private Dictionary<string, string> GetAllImageName2Path()
    {
        List<string> findPaths = new List<string>();
        for (int i = 0; i < atlasArray.Length; i++)
        {
            findPaths.Add(AtlasDir + atlasArray[i]);
        }
        var guids = AssetDatabase.FindAssets("t:sprite", findPaths.ToArray());
        Dictionary<string, string> name2Path = new Dictionary<string, string>();
        foreach (var guid in guids)
        {
            var assetPath = AssetDatabase.GUIDToAssetPath(guid);
            var assetName = Path.GetFileName(assetPath);
            if (name2Path.ContainsKey(assetName))
            {
                Debug.LogError("图片重名：" + assetName);
            }
            else
            {
                name2Path.Add(assetName, assetPath);
            }
        }
        return name2Path;
    }
}
