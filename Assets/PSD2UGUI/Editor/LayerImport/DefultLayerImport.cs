using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using System.Collections;
using System.Collections.Generic;

namespace PSDUIImporter
{
    public class DefultLayerImport : ILayerImport
    {
        PSDImportCtrl ctrl;
        public DefultLayerImport(PSDImportCtrl ctrl)
        {
            this.ctrl = ctrl;
        }
        public void DrawLayer(Layer layer, GameObject parent)
        {
            RectTransform obj = PSDImportUtility.LoadAndInstant<RectTransform>(PSDImporterConst.ASSET_PATH_EMPTY, layer.name, parent);
            obj.offsetMin = Vector2.zero;
            obj.offsetMax = Vector2.zero;
            obj.anchorMin = Vector2.zero;
            obj.anchorMax = Vector2.one;

            RectTransform rectTransform = parent.GetComponent<RectTransform>();
            obj.sizeDelta = rectTransform.sizeDelta;
            obj.anchoredPosition = rectTransform.anchoredPosition;

            if (layer.image != null)
            {
                PSImage image = layer.image;
                //ctrl.DrawImage(image, obj.gameObject);
                ctrl.DrawImage(image,parent, obj.gameObject);
            }

            DrawLayerCustom(obj);//广州寰宇添加 2022-5-27

            ctrl.DrawLayers(layer.layers, obj.gameObject);
        }

        public void DrawLayerCustom(RectTransform obj)
        {
            //广州寰宇添加 2022-5-27
            switch (obj.name)
            {
                case "ContentRoot":
                    var aspectRatioFitter = obj.gameObject.AddMissingComponent<AspectRatioFitter>();
                    aspectRatioFitter.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
#if kUseAddressables //临时宏
                    var fitInParentWithMinMax = obj.gameObject.AddMissingComponent<Assets.CustomAssets.Scripts.Foundation.UI.FitInParentWithMinMax>();
#endif
                    break;
                default:
                    break;
            }
            
        }
    }
}