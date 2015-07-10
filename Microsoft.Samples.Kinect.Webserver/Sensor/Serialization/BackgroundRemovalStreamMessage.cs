// -----------------------------------------------------------------------
// <copyright file="BackgroundRemovalStreamMessage.cs" company="Microsoft">
//     Copyright (c) Microsoft Corporation.  All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

namespace Microsoft.Samples.Kinect.Webserver.Sensor.Serialization
{
    using System;
    using System.Diagnostics.CodeAnalysis;

    using Microsoft.Kinect.Toolkit.BackgroundRemoval;

    /// <summary>
    /// Serializable representation of a background removed color stream message to send to client.
    /// </summary>
    [SuppressMessage("StyleCop.CSharp.NamingRules", "SA1300:ElementMustBeginWithUpperCaseLetter",
        Justification = "Lower case names allowed for JSON serialization.")]
    public class BackgroundRemovalStreamMessage : ImageHeaderStreamMessage
    {
        /// <summary>
        /// Bytes per pixel const.
        /// </summary>
        private const int BytesPerPixel = 4;

        /// <summary>
        /// Tracking ID of the player currently being tracked. Pixels that do not belong
        /// to this player are removed.
        /// </summary>
        /// <remarks>
        /// This value will be 0 if no player is found in the corresponding color frame.
        /// </remarks>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1709:IdentifiersShouldBeCasedCorrectly", MessageId = "tracked", Justification = "Lower case names allowed for JSON serialization.")]
        public int trackedPlayerId { get; set; }

        /// <summary>
        /// The average depth of the pixels corresponding to the foreground player.
        /// </summary>
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Naming", "CA1709:IdentifiersShouldBeCasedCorrectly", MessageId = "average", Justification = "Lower case names allowed for JSON serialization.")]
        public short averageDepth { get; set; }

        /// <summary>
        /// Buffer that holds background removed color image.
        /// </summary>
        internal byte[] Buffer { get; private set; }

        /// <summary>
        /// Update background removed color frame.
        /// </summary>
        /// <param name="frame">The input frame.</param>
        public void UpdateBackgroundRemovedColorFrame(BackgroundRemovedColorFrame frame)
        {
            if (frame == null)
            {
                throw new ArgumentNullException("frame");
            }

            this.timestamp = frame.Timestamp;
            this.width = 192;
            this.height = 320;
            this.bufferLength = 192 * 320 * 4;
            this.trackedPlayerId = frame.TrackedPlayerId;
            this.averageDepth = frame.AverageDepth;

            if ((this.Buffer == null) || (this.Buffer.Length != this.bufferLength))
            {
                this.Buffer = new byte[this.bufferLength];
            }

            // resize to 192x320
            // from 640x480, cut 224 off each left/right side; 80 each top/bottom.
            // EDIT: don't cut off top 80, leave as-is.
            unsafe
            {
                fixed (byte* messageDataPtr = this.Buffer)
                {
                    fixed (byte* frameDataPtr = frame.GetRawPixelData())
                    {
                        byte* messageDataPixelPtr = messageDataPtr;
                        byte* frameDataPixelPtr = frameDataPtr;

                        // Write color values using int pointers instead of byte pointers,
                        // since each color pixel is 32-bits wide.
                        byte* currentPixelRowPtr = frameDataPixelPtr + 224 * 4;

                        for (int row = 0; row < 320; row += 1)
                        {
                            byte* currentPixelPtr = currentPixelRowPtr;
                            for (int column = 0; column < 192; column += 1)
                            {
                                // Convert from BGRA to RGBA format
                                *(messageDataPixelPtr++) = *(currentPixelPtr + 2);
                                *(messageDataPixelPtr++) = *(currentPixelPtr + 1);
                                *(messageDataPixelPtr++) = *currentPixelPtr;
                                *(messageDataPixelPtr++) = *(currentPixelPtr + 3);

                                currentPixelPtr += BytesPerPixel;
                            }

                            currentPixelRowPtr += 640 * 4;
                        }
                    }
                }
            }
        }
    }
}
