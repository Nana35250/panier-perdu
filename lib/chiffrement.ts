import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

function cle(): Buffer {
  const secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) throw new Error("Secret Shopify manquant.");
  return scryptSync(secret, "panier-perdu-jetons", 32);
}

export function chiffrer(texte: string): string {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cle(), iv);
  const contenu = Buffer.concat([chiffreur.update(texte, "utf8"), chiffreur.final()]);
  const etiquette = chiffreur.getAuthTag();
  return [iv, etiquette, contenu].map((p) => p.toString("base64")).join(".");
}

export function dechiffrer(valeur: string): string {
  const [iv, etiquette, contenu] = valeur
    .split(".")
    .map((p) => Buffer.from(p, "base64"));
  const dechiffreur = createDecipheriv("aes-256-gcm", cle(), iv);
  dechiffreur.setAuthTag(etiquette);
  return Buffer.concat([dechiffreur.update(contenu), dechiffreur.final()]).toString("utf8");
}
