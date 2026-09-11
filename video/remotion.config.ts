import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Hero-Loop läuft im Browser stumm im Autoplay – kein Audio nötig.
Config.setCodec("h264");
