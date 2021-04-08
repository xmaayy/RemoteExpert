using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using Microsoft.MixedReality.WebRTC.Unity;
using ZXing;
using ZXing.QrCode;

public class QRCodeScanner : MonoBehaviour
{
    // public QRCodeWatcher qRCodeWatcher;
    public PeerConnection PC;
    public CustomNodeDssSignaler signaler;
    // All of these gameobjects will be activated after the scan is done
    public GameObject LocalMedia;
    // Start is called before the first frame update
 // Texture for encoding test
    public Texture2D encoded;

    private WebCamTexture camTexture;
    private Thread qrThread;

    private Color32[] c;
    private int W, H;

    private Rect screenRect;

    private bool isQuit;

    public string LastResult;
    private bool shouldEncodeNow;

    void OnGUI()
    {
        if(!isQuit){
            GUI.DrawTexture(screenRect, camTexture, ScaleMode.ScaleToFit);
        }
    }

    void OnEnable()
    {
        if (camTexture != null)
        {
            camTexture.Play();
            W = camTexture.width;
            H = camTexture.height;
        }
    }

    void OnDisable()
    {
        if (camTexture != null)
        {
            camTexture.Pause();
        }
    }

    void OnDestroy()
    {
        qrThread.Abort();
        camTexture.Stop();
    }

    // It's better to stop the thread by itself rather than abort it.
    void OnApplicationQuit()
    {
        isQuit = true;
    }

    void Start()
    {
        encoded = new Texture2D(256, 256);
        if (System.String.IsNullOrEmpty(LastResult)){
            LastResult = "http://www.google.com";
        }
        shouldEncodeNow = true;

        screenRect = new Rect(0, 0, Screen.width, Screen.height);

        camTexture = new WebCamTexture();
        camTexture.requestedHeight = Screen.height; // 480;
        camTexture.requestedWidth = Screen.width; //640;
        OnEnable();

        qrThread = new Thread(DecodeQR);
        qrThread.Start();
    }

    void Update()
    {
        if(!isQuit){
            try {
                if (LastResult != "http://www.google.com"){
                    QRMessage message = QRMessage.CreateFromJSON(LastResult);
                    isQuit = true;
                    // camTexture.Stop();
                    // qrThread.Abort();

                    // CustomNodeDssSignaler signalerScript = signaler.GetComponent(typeof(CustomNodeDssSignaler)) as CustomNodeDssSignaler;

                    signaler.PeerConnection = PC;
                    signaler.Base64Key = message.key;
                    signaler.Base64IV = message.iv;
                    signaler.HttpServerAddress = message.ip;
                    signaler.RemotePeerId = message.id;
                    signaler.LocalPeerId = "HoloLens";
                    // if there is a signaler attached, it should grab the signaller now
                    LocalMedia.SetActive(true);
                    signaler.gameObject.SetActive(true);
                    signaler.PeerConnection.StartConnection();
                    gameObject.SetActive(false);
                }
            } catch (System.ArgumentException e){
                print(e);
            }

            if (c == null)
            {
                c = camTexture.GetPixels32();
            }

            // encode the last found
            var textForEncoding = LastResult;
            if (shouldEncodeNow &&
                textForEncoding != null)
            {
                var color32 = Encode(textForEncoding, encoded.width, encoded.height);
                encoded.SetPixels32(color32);
                encoded.Apply();
                shouldEncodeNow = false;
            }
        }
    }

    void DecodeQR()
    {
        // create a reader with a custom luminance source
        var barcodeReader = new BarcodeReader { AutoRotate = false };

        while (true)
        {
            if (isQuit)
                break;

            try
            {
                // decode the current frame
                var result = barcodeReader.Decode(c, W, H);
                if (result != null)
                {
                    LastResult = result.Text;
                    shouldEncodeNow = true;
                } 
                // Sleep a little bit and set the signal to get the next frame
                Thread.Sleep(200);
                c = null;
            }
            catch (System.Exception e)
            {
            }
        }
    }


    private static Color32[] Encode(string textForEncoding, int width, int height)
    {
        var writer = new BarcodeWriter
        {
            Format = BarcodeFormat.QR_CODE,
            Options = new QrCodeEncodingOptions
            {
                Height = height,
                Width = width
            }
        };
        return writer.Write(textForEncoding);
    }

    class QRMessage {
        public string key;
        public string iv;
        public string ip;
        public string id;

        public static QRMessage CreateFromJSON(string jsonString)
        {
            return JsonUtility.FromJson<QRMessage>(jsonString);
        }
    }
}