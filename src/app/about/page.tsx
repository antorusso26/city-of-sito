import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/TextPage";

export const metadata: Metadata = { title: "About City Of", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <TextPage eyebrow="About" title="Who we are">
      <p>City Of started on the Amalfi Coast, where we grew up. [FOUNDERS&apos; NAMES AND A FEW LINES ABOUT THEM — written by you, not by us.]</p>
      <h2>Why</h2>
      <p>Most booking sites list hundreds of tours and leave you to guess which ones are good, and what the price really includes. We do the opposite: a few things in each town, chosen in person, with the full price said first and the partner named on every page.</p>
      <h2>How we choose</h2>
      <ul>
        <li>We try every service before we list it.</li>
        <li>We know the people who run it by name.</li>
        <li>We list the extras you pay on the day, before you book.</li>
        <li>No exclusivity: partners work with us because guests arrive informed.</li>
      </ul>
      <h2>City by city</h2>
      <p>One site per area, a section per town: the <Link href="/amalfi-coast">Amalfi Coast</Link> first, then more coasts. Each town has its colour and its handle on the helm.</p>
    </TextPage>
  );
}
