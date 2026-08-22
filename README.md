# Portfolio site — setup notes

This is a single-page static site (`index.html`, no build step). Deploy it on Vercel, GitHub Pages, or Netlify by just pointing them at this folder.

## Things to fill in before publishing

1. **CV** — put your PDF at `assets/cv/Ghifar_Khder_CV.pdf` (or change the two `href` links in `index.html` if you name it differently).
2. **Electronics projects** — in the "Hardware Work" section, replace each placeholder `.elec-media` div with your real photo/video and update the title + description. Example:
   ```html
   <div class="elec-media">
     <img src="assets/electronics/ecg-monitor.jpg" alt="Custom ECG monitor build">
   </div>
   ```
   or for video:
   ```html
   <div class="elec-media">
     <video src="assets/electronics/ecg-monitor.mp4" controls></video>
   </div>
   ```
3. **Project descriptions** — the "Coronary Stenosis Detector" and "Fetal Brain Ultrasound Classifier" cards link to your GitHub profile generally (`github.com/Ghifar-Khder`) since I didn't have their exact repo names — update those links to the specific repos once you confirm the names.
4. **Contact info** — currently shows email, LinkedIn, GitHub, and city only (no phone/street address), since that's usually what people put on a public portfolio. Add more if you want.

## Local preview

Just open `index.html` in a browser — no server needed.
