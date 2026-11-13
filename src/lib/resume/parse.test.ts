import assert from "node:assert/strict";
import test from "node:test";

import { parseResume, parseSkills, splitSkillLine } from "./parse";

test("commas inside brackets stay in one skill", () => {
  assert.deepEqual(splitSkillLine("AWS (ECS, RDS, S3)"), ["AWS (ECS, RDS, S3)"]);
  assert.deepEqual(splitSkillLine("AWS (ECS, RDS, S3), Docker; Kubernetes | CI/CD"), [
    "AWS (ECS, RDS, S3)",
    "Docker",
    "Kubernetes",
    "CI/CD",
  ]);
  assert.deepEqual(splitSkillLine("C++ [11, 14, 17]; Go {generics, routines}"), [
    "C++ [11, 14, 17]",
    "Go {generics, routines}",
  ]);
  assert.deepEqual(splitSkillLine("Foo (bar (baz, qux), quux), Zed"), ["Foo (bar (baz, qux), quux)", "Zed"]);
  assert.deepEqual(splitSkillLine("Tools (ESLint / Prettier), Git"), ["Tools (ESLint / Prettier)", "Git"]);
});

test("slash splits only when spaces surround it", () => {
  assert.deepEqual(splitSkillLine("CI/CD"), ["CI/CD"]);
  assert.deepEqual(splitSkillLine("Node.js/TypeScript"), ["Node.js/TypeScript"]);
  assert.deepEqual(splitSkillLine("React / Next.js"), ["React", "Next.js"]);
  assert.deepEqual(splitSkillLine("React  /  Next.js / Remix"), ["React", "Next.js", "Remix"]);
});

test("unbalanced brackets fall back to a plain split", () => {
  assert.deepEqual(splitSkillLine("AWS (ECS, RDS, S3"), ["AWS (ECS", "RDS", "S3"]);
  assert.deepEqual(splitSkillLine("AWS (ECS, RDS], Docker"), ["AWS (ECS", "RDS]", "Docker"]);
  assert.deepEqual(splitSkillLine("CI/CD (and more, still"), ["CI/CD (and more", "still"]);
  assert.deepEqual(splitSkillLine("React / Next.js (partial"), ["React", "Next.js (partial"]);
});

test("parseSkills dedupes without case and keeps names up to 60 characters", () => {
  const kept = `AWS (${"E".repeat(50)}, S3)`;
  assert.equal(kept.length, 60);
  const dropped = `${kept}!`;
  assert.deepEqual(
    parseSkills([`- ${kept}, ${dropped}, React`, "react; TypeScript | REACT"]),
    [kept, "React", "TypeScript"],
  );
  assert.deepEqual(parseSkills(["AWS (ECS, RDS, S3), aws (ecs, rds, s3), CI/CD"]), ["AWS (ECS, RDS, S3)", "CI/CD"]);
});

test("a skills section keeps bracketed names and spaced slashes", () => {
  const resume = parseResume(`Ada Lovelace
Engineer
Skills
AWS (ECS, RDS, S3), CI/CD, React / Next.js
`);
  assert.deepEqual(
    resume.skills.map((skill) => skill.name),
    ["AWS (ECS, RDS, S3)", "CI/CD", "React", "Next.js"],
  );
});
