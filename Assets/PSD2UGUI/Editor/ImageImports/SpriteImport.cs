using System;
using UnityEngine;
using UnityEditor;
using UnityEngine.UI;
using UnityEngine.Events;
using System.Collections;
using System.Collections.Generic;



namespace PSDUIImporter
{
    public class SpriteImport : IImageImport
    {
        PSDImportCtrl ctrl;
        public SpriteImport(PSDImportCtrl ctrl)
        {
            this.ctrl = ctrl;
        }

        public void DrawImage(PSImage image, GameObject parent, GameObject ownObj = null)
        {
            if (image.imageSource == ImageSource.Common || image.imageSource == ImageSource.Custom)
            {
                UnityEngine.UI.Image pic;
                if (ownObj != null)
                {
                    pic = ownObj.AddMissingComponent<UnityEngine.UI.Image>();
                }
                else
                {
                    Debug.LogError("SpriteImport使用了image.name：" + image.name + " 违反规则，请告诉你柏祥");
                    pic = PSDImportUtility.LoadAndInstant<UnityEngine.UI.Image>(PSDImporterConst.ASSET_PATH_IMAGE, image.name, parent);
                }
                RectTransform rectTransform = pic.GetComponent<RectTransform>();
                rectTransform.offsetMin = new Vector2(0.5f, 0.5f);
                rectTransform.offsetMax = new Vector2(0.5f, 0.5f);
                rectTransform.anchorMin = new Vector2(0.5f, 0.5f);
                rectTransform.anchorMax = new Vector2(0.5f, 0.5f);

                string suffix = PSDImporterConst.PNG_SUFFIX;
                if(image.arguments != null && image.arguments[0] == "JPG")
                {
                    suffix = PSDImporterConst.JPG_SUFFIX;
                }
                string assetPath = PSDImportUtility.baseDirectory + image.CustomImageName + suffix;
                Sprite sprite = AssetDatabase.LoadAssetAtPath(assetPath, typeof(Sprite)) as Sprite;

                if (sprite == null)
                {
                    Debug.LogError("loading asset error, at path: " + assetPath);
                }

                

                if (pic.name.Contains(PSDImporterConst.SPINE))//2022-5-20 广州寰宇添加 Spine动画不添加
                {
                    pic.sprite = null;
                    pic.color = Color.red;

                    //一个提示性语句：程序员需要添加Spine
                    var hint = "请需要添加Spine";
                    var imageLable = new PSImage();
                    imageLable.imageType = ImageType.Label;
                    imageLable.imageSource = ImageSource.Common;
                    imageLable.name = hint;
                    imageLable.position = image.position;
                    imageLable.size = image.size;
                    imageLable.arguments = new string[] {"FFFFFF", "SourceHanSansCN-Medium", "20", hint};
                    ctrl.DrawImage(imageLable, pic.gameObject);
                }
                else
                {
                    pic.sprite = sprite;
                }

                rectTransform.sizeDelta = new Vector2(image.size.width, image.size.height);
                rectTransform.anchoredPosition = new Vector2(image.position.x, image.position.y);
            }
            else if (image.imageSource == ImageSource.Global)
            {
                UnityEngine.UI.Image pic;
                if (ownObj != null)
                    pic = ownObj.AddMissingComponent<UnityEngine.UI.Image>();
                else
                    pic = PSDImportUtility.LoadAndInstant<UnityEngine.UI.Image>(PSDImporterConst.ASSET_PATH_IMAGE, image.name, parent); 

                RectTransform rectTransform = pic.GetComponent<RectTransform>();
                rectTransform.offsetMin = new Vector2(0.5f, 0.5f);
                rectTransform.offsetMax = new Vector2(0.5f, 0.5f);
                rectTransform.anchorMin = new Vector2(0.5f, 0.5f);
                rectTransform.anchorMax = new Vector2(0.5f, 0.5f);

                string commonImagePath = PSDImporterConst.Globle_BASE_FOLDER + image.name.Replace(".", "/") + PSDImporterConst.PNG_SUFFIX;
                Debug.Log("==  CommonImagePath  ====" + commonImagePath);
                Sprite sprite = AssetDatabase.LoadAssetAtPath(commonImagePath, typeof(Sprite)) as Sprite;
                pic.sprite = sprite;

                pic.name = image.name;

                if (image.imageType == ImageType.SliceImage)
                {
                    pic.type = UnityEngine.UI.Image.Type.Sliced;
                }

                //RectTransform rectTransform = pic.GetComponent<RectTransform>();
                rectTransform.sizeDelta = new Vector2(image.size.width, image.size.height);
                rectTransform.anchoredPosition = new Vector2(image.position.x, image.position.y);
            }
        }
    }
}
