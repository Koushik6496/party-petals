import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Copy,
  Flower2,
  Sparkles,
} from 'lucide-react';

const OCCASIONS = [
  'Birthday',
  'Wedding',
  'Baby welcome',
  'Proposal',
  'Anniversary',
];

const SPACES = [
  'Home',
  'Party hall',
  'Outdoor / beach',
  'Large venue',
];

const PALETTES = [
  ['Blush & gold', 'blush pink and gold'],
  ['Ivory & sage', 'ivory and sage green'],
  ['Navy & gold', 'navy blue and gold'],
  ['Pastel', 'soft pastel colours'],
  ['Surprise me', 'harmonious elegant colours'],
];

function Chips({
  items,
  value,
  setValue,
}) {
  return (
    <div className="dsChips">
      {items.map(item => {
        const label = Array.isArray(item)
          ? item[0]
          : item;

        const selectedValue = Array.isArray(value)
          ? value[0]
          : value;

        return (
          <button
            type="button"
            className={
              label === selectedValue
                ? 'on'
                : ''
            }
            key={label}
            onClick={() => setValue(item)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

async function dataUrlToFile(
  dataUrl,
  fileName
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File(
    [blob],
    fileName,
    {
      type: blob.type || 'image/jpeg',
    }
  );
}

export default function DesignStudio({
  phone,
  onGenerated,
}) {
  const [occasion, setOccasion] =
    useState('Birthday');

  const [space, setSpace] =
    useState('Home');

  const [palette, setPalette] =
    useState(PALETTES[0]);

  const [idea, setIdea] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [image, setImage] =
    useState('');

  const [error, setError] =
    useState('');

  const [copied, setCopied] =
    useState(false);

  const createConcept = async () => {
    if (!idea.trim()) {
      return;
    }

    setBusy(true);
    setError('');
    setCopied(false);

    const prompt =
      `Professional event decoration photograph, ` +
      `${occasion}, ${space}, ${palette[1]}, ` +
      `${idea}, full stage, balloons, florals, ` +
      `premium lighting, realistic, no people, ` +
      `no text`;

    try {
      const response = await fetch(
        '/api/design',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            prompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.image) {
        throw new Error(
          data.error ||
          'No image was returned.'
        );
      }

      setImage(data.image);

      if (onGenerated) {
        onGenerated(data.image);
      }
    } catch (conceptError) {
      console.error(
        'Concept generation failed:',
        conceptError
      );

      setError(
        conceptError.message ||
        'Concept generation is temporarily unavailable. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const buildMessage = () => {
    return `Hello Party Petals, I want this custom concept.

Occasion: ${occasion}
Space: ${space}
Colours: ${palette[0]}
Idea: ${idea}

Generated through the Party Petals Design Studio.`;
  };

  const copyDetails = async text => {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);

      return true;
    } catch (clipboardError) {
      console.warn(
        'Could not copy details:',
        clipboardError
      );

      return false;
    }
  };

  const downloadImage = () => {
    if (!image) {
      return;
    }

    const download =
      document.createElement('a');

    download.href = image;

    download.download =
      'party-petals-generated-concept.jpg';

    document.body.appendChild(download);

    download.click();
    download.remove();
  };

  const openWhatsApp = text => {
    const whatsappUrl =
      `https://wa.me/${phone}` +
      `?text=${encodeURIComponent(text)}`;

    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareConcept = async () => {
    if (!idea.trim()) {
      setError(
        'Please describe your idea first.'
      );

      return;
    }

    const text = buildMessage();

    const detailsCopied =
      await copyDetails(text);

    if (!image) {
      openWhatsApp(text);
      return;
    }

    try {
      const file = await dataUrlToFile(
        image,
        'party-petals-generated-concept.jpg'
      );

      const fileSharingSupported =
        navigator.share &&
        navigator.canShare?.({
          files: [file],
        });

      if (fileSharingSupported) {
        alert(
          `${
            detailsCopied
              ? 'Your event details have been copied.'
              : 'Your generated image is ready.'
          }

Next steps:

1. Select WhatsApp
2. Select Party Petals
3. Paste the copied details as the image caption
4. Send the message`
        );

        await navigator.share({
          title:
            'Party Petals Generated Concept',

          files: [file],
        });

        return;
      }

      downloadImage();

      alert(
        `${
          detailsCopied
            ? 'The concept image has been downloaded and your event details have been copied.'
            : 'The concept image has been downloaded.'
        }

WhatsApp will open next.

Attach the downloaded image and paste the copied event details.`
      );

      openWhatsApp(text);
    } catch (shareError) {
      if (
        shareError?.name ===
        'AbortError'
      ) {
        return;
      }

      console.error(
        'Concept sharing failed:',
        shareError
      );

      downloadImage();
      openWhatsApp(text);
    }
  };

  return (
    <section
      id="studio"
      className="ds"
    >
      <div className="dsIntro">
        <p className="kicker">
          <Sparkles />
          DESIGN STUDIO
        </p>

        <h2>
          Imagine it.
          <br />
          <i>We will style it.</i>
        </h2>

        <p>
          Build a visual direction, then
          share the generated concept and
          complete brief with Party Petals.
        </p>
      </div>

      <div className="dsGrid">
        <div>
          <label>OCCASION</label>

          <Chips
            items={OCCASIONS}
            value={occasion}
            setValue={setOccasion}
          />

          <label>SPACE</label>

          <Chips
            items={SPACES}
            value={space}
            setValue={setSpace}
          />

          <label>COLOURS</label>

          <Chips
            items={PALETTES}
            value={palette}
            setValue={setPalette}
          />

          <label>
            DESCRIBE THE IDEA
          </label>

          <textarea
            value={idea}
            onChange={event => {
              setIdea(
                event.target.value
              );

              setError('');
            }}
            placeholder="Sunset beach, red and black theme, lanterns and a floral arch..."
          />

          <button
            type="button"
            disabled={
              !idea.trim() || busy
            }
            className="gold dsGo"
            onClick={createConcept}
          >
            {busy
              ? 'DESIGNING...'
              : 'GENERATE CONCEPT'}

            <Sparkles />
          </button>

          {error && (
            <p className="dsErr">
              {error}
            </p>
          )}

          {copied && (
            <p className="dsCopied">
              <Check />
              Event details copied. Paste
              them into the WhatsApp image
              caption.
            </p>
          )}

          <button
            type="button"
            className="dsRequest"
            onClick={shareConcept}
            disabled={!idea.trim()}
          >
            SHARE CONCEPT WITH PARTY PETALS
            <ArrowRight />
          </button>

          {image && (
            <button
              type="button"
              className="dsCopyDetails"
              onClick={() =>
                copyDetails(buildMessage())
              }
            >
              <Copy />
              COPY EVENT DETAILS
            </button>
          )}
        </div>

        <div className="dsStage">
          {image ? (
            <motion.img
              src={image}
              alt="Generated Party Petals event concept"
              initial={{
                opacity: 0,
                scale: 1.04,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
            />
          ) : (
            <div>
              <Flower2 />

              <p>
                {busy
                  ? 'Sketching your concept...'
                  : 'Your generated concept appears here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}