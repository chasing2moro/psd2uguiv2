using PSDUIImporter;
using UnityEngine;
using UnityEngine.UI;

public class PSDAnchorMaker
{
    public static void SetAnchorCustom(RectTransform rect, Vector2 AnchorMin, Vector2 AnchorMax)
    {
        var Parent = rect.parent;
        if (Parent) rect.SetParent(null);
        rect.anchorMin = AnchorMin;
        rect.anchorMax = AnchorMax;
        if (Parent) rect.SetParent(Parent);
    }

    public void SetAllAnchors()
    {
        var root = PSDDispatchRes.GetRootUI();
        var rects = root.GetComponentsInChildren<RectTransform>();
        foreach (var rect in rects)
        {
            SetAnchor(rect);
        }
    }

    private void SetAnchor(RectTransform obj)
    {
        //广州寰宇添加 2022-5-27
        switch (obj.name)
        {
            case "ContentL":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.zero, Vector2.up);
                break;
            case "ContentLB":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.zero, Vector2.zero);
                break;
            case "ContentLT":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.up, Vector2.up);
                break;
            case "ContentR":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.right, Vector2.one);
                break;
            case "ContentRB":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.right, Vector2.right);
                break;
            case "ContentRT":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.one, Vector2.one);
                break;
            case "ContentT":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.up, Vector2.one);
                break;
            case "ContentB":
                SetAnchorCustom(obj.GetComponent<RectTransform>(), Vector2.zero, Vector2.right);
                break;
            default:
                break;
        }
    }
}

