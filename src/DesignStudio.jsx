import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Download,
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
  [
    'Blush & gold',
    'blush pink and gold',
  ],
  [
    'Ivory & sage',
    'ivory and sage green',
  ],
  [
    'Navy & gold',
    'navy blue and gold',
  ],
  [
    'Pastel',
    'soft pastel colours',
  ],
  [
    'Surprise me',
    'harmonious elegant colours',
  ],
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

        const selectedValue =
          Array.isArray(value)
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
            onClick={() =>
              setValue(item)
            }
          >
            {label}
          </button>
        );
      })}
    </div>
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

  const [sharing, setSharing] =
    useState(false);

  const [image, setImage] =
    useState('');

  const [error, setError] =
    useState('');

  const [
    shareNotice,
    setShareNotice,
  ] = useState('');

  const createConcept = async () => {
    if (!idea.trim()) {
      setError(
        'Please describe your event idea.'
      );

      return;
    }

    setBusy(true);
    setError('');
    setShareNotice('');

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
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            prompt,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.image
      ) {
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
    return `Hello Party Petals, I want this custom event concept.

Occasion: ${occasion}
Space: ${space}
Colours: ${palette[0]}
Idea: ${idea.trim()}

A generated concept image has been downloaded from the Party Petals Design Studio. I will attach the image to this message.

Please share availability and further details.`;
  };

  const downloadImage = () => {
    if (!image) {
      return false;
    }

    const download =
      document.createElement('a');

    download.href = image;

    download.download =
      `party-petals-${occasion
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )}-concept.jpg`;

    document.body.appendChild(
      download
    );

    download.click();
    download.remove();

    return true;
  };

  const openPartyPetalsWhatsApp =
    message => {
      const cleanPhone = String(
        phone || ''
      ).replace(/\D/g, '');

      if (!cleanPhone) {
        setError(
          'Party Petals WhatsApp number is unavailable.'
        );

        return;
      }

      const whatsappUrl =
        `https://wa.me/${cleanPhone}` +
        `?text=${encodeURIComponent(
          message
        )}`;

      window.open(
        whatsappUrl,
        '_blank',
        'noopener,noreferrer'
      );
    };

  const shareConcept = () => {
    if (!idea.trim()) {
      setError(
        'Please describe your event idea first.'
      );

      return;
    }

    if (!image) {
      setError(
        'Please generate a concept image first.'
      );

      return;
    }

    setSharing(true);
    setError('');

    const message = buildMessage();

    try {
      downloadImage();

      setShareNotice(
        'The concept image has been downloaded. Party Petals WhatsApp is opening with all details filled. Attach the downloaded image and tap Send.'
      );

      openPartyPetalsWhatsApp(
        message
      );
    } catch (shareError) {
      console.error(
        'Could not prepare concept sharing:',
        shareError
      );

      setError(
        'The concept could not be prepared for WhatsApp. Please try again.'
      );
    } finally {
      setSharing(false);
    }
  };

  const downloadConceptOnly = () => {
    if (!image) {
      setError(
        'Please generate a concept image first.'
      );

      return;
    }

    downloadImage();

    setShareNotice(
      'The generated concept image has been downloaded.'
    );
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

          <i>
            We will style it.
          </i>
        </h2>

        <p>
          Build a visual direction,
          generate a concept and send
          the complete idea directly
          to Party Petals.
        </p>
      </div>

      <div className="dsGrid">
        <div>
          <label>
            OCCASION
          </label>

          <Chips
            items={OCCASIONS}
            value={occasion}
            setValue={
              setOccasion
            }
          />

          <label>
            SPACE
          </label>

          <Chips
            items={SPACES}
            value={space}
            setValue={setSpace}
          />

          <label>
            COLOURS
          </label>

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
              setShareNotice('');
            }}
            placeholder="Sunset beach, red and black theme, lanterns and a floral arch..."
          />

          <button
            type="button"
            disabled={
              !idea.trim() ||
              busy
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

          {shareNotice && (
            <p className="dsCopied">
              <Check />

              <span>
                {shareNotice}
              </span>
            </p>
          )}

          <button
            type="button"
            className="dsRequest"
            onClick={shareConcept}
            disabled={
              !idea.trim() ||
              !image ||
              sharing
            }
          >
            {sharing
              ? 'OPENING PARTY PETALS...'
              : 'SEND CONCEPT TO PARTY PETALS'}

            <ArrowRight />
          </button>

          {image && (
            <button
              type="button"
              className="dsCopyDetails"
              onClick={
                downloadConceptOnly
              }
            >
              <Download />
              DOWNLOAD CONCEPT IMAGE
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