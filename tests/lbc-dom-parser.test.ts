import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { LeboncoinDomParser } from "../src/content/lbc-dom-parser";

function loadSample(
  domParser: LeboncoinDomParser,
  filename: string,
): Element[] {
  const html = readFileSync(
    resolve(__dirname, "../samples", filename),
    "utf-8",
  );
  const doc = new DOMParser().parseFromString(html, "text/html");
  const articles = domParser.findAnnonceElements(doc);
  if (articles.length === 0)
    throw new Error(`Aucun <article> trouvé dans ${filename}`);
  return articles;
}

describe("LeboncoinDomParser", () => {
  const parser = new LeboncoinDomParser();

  describe("annonce-item.html", () => {
    let article: Element;
    beforeEach(() => {
      const articles = loadSample(parser, "annonce-item.html");
      article = articles[0];
    });

    it("extrait l'ID depuis le href", () => {
      expect(parser.extractAnnonceInfo(article)?.id).toBe("3188820134");
    });

    it("extrait le titre", () => {
      expect(parser.extractAnnonceInfo(article)?.title).toBe(
        "Table camping et table a tapisser",
      );
    });

    it("extrait le prix", () => {
      expect(parser.extractAnnonceInfo(article)?.price).toBe("45 €");
    });

    it("extrait l'URL", () => {
      expect(parser.extractAnnonceInfo(article)?.url).toContain(
        "/ad/equipement_caravaning/3188820134",
      );
    });
  });

  describe("annonces-list.html", () => {
    let article: Element;
    beforeEach(() => {
      const articles = loadSample(parser, "annonces-list.html");
      article = articles[0];
    });

    it("extrait l'ID depuis le href", () => {
      expect(parser.extractAnnonceInfo(article)?.id).toBe("3114459690");
    });

    it("extrait le titre", () => {
      expect(parser.extractAnnonceInfo(article)?.title).toBe(
        "Enfilade teck scandinave et vintage",
      );
    });

    it("extrait le prix", () => {
      expect(parser.extractAnnonceInfo(article)?.price).toBe("1 149 €");
    });

    it("extrait l'URL", () => {
      expect(parser.extractAnnonceInfo(article)?.url).toContain(
        "/ad/ameublement/3114459690",
      );
    });
  });
});
