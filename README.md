# Zenodo Certificate Maker 🎓⚛️

> *"Because my college literally demands a physical certificate for every damn thing I do to prove I didn't just hallucinate my research."*

Welcome to the **Zenodo Certificate Maker**! This is an open-source, brutalist, highly-experimental web app and Editor Workspace designed to do *one thing flawlessly*: dynamically generate stunning, professional A4 certificates for your open-science Zenodo papers.

**CRAFTED BY:** [Rishi Shah](https://rishishah.in)

**DISCLAIMER: I have absolutely zero affiliation with Zenodo or CERN.** I'm just trying to survive academia. Plz don't sue me.

## 🚀 What It Does
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/3016fe10-837d-4dfe-b4c6-25ba483dc765" />



When you're trying to prove you published a research paper or dataset on Zenodo, a link usually isn't enough for bureaucratic academic committees, administrations, and universities. They want *paper*. They want *certificates*. They want *proof*.

This tool allows you to:
1. **Fetch from Zenodo:** Enter a valid `zenodo.org/records/...` URL and watch as it magically pulls the API metadata (Authors, Publication Date, Title, DOI).
2. **Customize:** Inject your own custom Name, Enrollment ID, and Affiliation.
3. **Template Select:** Pick between 3 extremely official-looking templates (`Classic`, `Modern`, `Minimal`).
4. **Export HQ PDF:** Click `[ EXPORT_PDF ]` to generate a 3x resolution, crisp, perfect A4 size PDF Certificate featuring realistic stamps, your DOI mapped to a working QR code, and perfect formatting without stretched fonts.

## 🎭 The Vibe

The UI/UX is built to contrast violently against the certificates themselves:
* **The Landing Page:** A brutalist, physics-driven playground built with `matter-js`. Words fall from the heavens, you can drag them around, bounce them off the walls, and see a massive ASCII terminal text art.
* **The Editor Workspace:** High-contrast terminal aesthetics. `#0a0a0a` background. Transparent inputs. Wireframe borders. Because why not?
* **The Outputs:** Clean, extremely professional, blindingly bright white, perfect A4 certificates. 

## 🛠️ Built With

* **React + Vite**
* **Tailwind CSS** (for the insanely fast styling)
* **Matter.js** (for those beautiful bouncy physics bodies)
* **qrcode.react** (for mapping Zenodo DOIs directly into the certificate)
* **Framer Motion** (for the buttery smooth entry sequence)
* **html2canvas + jspdf** (for the heavy lifting to turn DOM -> High-Res A4 Canvas -> PDF)

## 💻 How To Run Locally

It's just standard Node.js & Vite!

```bash
# Clone this wildly official project
git clone https://github.com/yourusername/zenodo-cert-maker.git

# Enter the void
cd zenodo-cert-maker

# Install the bits (npm/yarn/pnpm all work)
npm install

# Start the dev server
npm run dev
```

Then open `http://localhost:3000` in your browser. Throw the physics words around. Get to the editor. Make your certificate.

## 🤝 Contributing

Are your college professors demanding even more absurd requirements? Do they want a 3rd QR code? A watermarked logo of a random bird?

Feel free to fork this, open issues, or submit Pull Requests. Let's build the ultimate defense against academic bureaucracy together. 

## 📜 License

MIT License. Do whatever you want with it. Generate 10,000 certificates for your cat. 
