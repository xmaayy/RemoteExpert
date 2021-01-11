using System;
using System.Linq;
using System.IO;
using System.Security.Cryptography;

public class HMACSHA256example
{

    public static void Main(string[] Fileargs)
    {
        // Create a random key using a random number generator. This would be the
        //  secret key shared by sender and receiver.
        byte[] secretkey = new Byte[64];
        //RNGCryptoServiceProvider is an implementation of a random number generator.
        using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider())
        {
            // The array is now filled with cryptographically strong random bytes.
            rng.GetBytes(secretkey);

            // Use the secret key to sign the message file.
            byte[] signature = Sign(secretkey, "Test Message");
            string messageString = System.Text.Encoding..GetString(signature, 0, signature.Length);
            Console.WriteLine(messageString);

            // Verify the signed file
            bool verify = Verify(secretkey, "Test Message", signature);
            Console.WriteLine(verify);
        }
    }  //end main
    // Computes a keyed hash for a source file and creates a target file with the keyed hash
    // prepended to the contents of the source file.
    public static byte[] Sign(byte[] key, String message)
    {
        // Initialize the keyed hash object.
        using (HMACSHA256 hmac = new HMACSHA256(key))
        {
            byte[] messageBytes = System.Text.Encoding.UTF8.GetBytes(message);
            Console.WriteLine(messageBytes);
            Console.WriteLine("About to compute hash");
            // Compute the hash of the input file.
            byte[] hashValue = hmac.ComputeHash(messageBytes);
            return hashValue;
        }
    } // end SignFile

    // Compares the key in the source file with a new key created for the data portion of the file. If the keys
    // compare the data has not been tampered with.
    public static bool Verify(byte[] key, String message, byte[] receivedHash)
    {
        // Initialize the keyed hash object.
        byte[] generatedHash = Sign(key, message);
        return generatedHash.SequenceEqual(receivedHash);
    } 


    public static Stream GenerateStreamFromString(string s)
    {
        var stream = new MemoryStream();
        var writer = new StreamWriter(stream);
        writer.Write(s);
        writer.Flush();
        stream.Position = 0;
        return stream;
    }
} //end class