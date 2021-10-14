# SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
# SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
#
# SPDX-License-Identifier: Apache-2.0

# build with:
# $ nix-build -E 'with import <nixpkgs> { }; callPackage ./default.nix { }'

{ gsettings-desktop-schemas, hicolor-icon-theme, gtk3, appimageTools }:
let
  pname = "opossum-ui";
  version =
    (builtins.fromJSON (builtins.readFile (./src/commitInfo.json))).commitInfo;
  name = "${pname}-${version}";
  src = ./release/linux_and_windows/OpossumUI-0.1.0.AppImage;

  appimageContents = appimageTools.extractType2 { inherit name src; };

  xdg_dirs = builtins.concatStringsSep ":" [
    "${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}"
    "${hicolor-icon-theme}/share/gsettings-schemas/${hicolor-icon-theme.name}"
    "${gtk3}/share/gsettings-schemas/${gtk3.name}"
  ];
in {
  "${pname}" = appimageTools.wrapType2 rec {
    inherit name src;

    extraPkgs = pkgs:
      with pkgs; [
        wrapGAppsHook
        gtk3
        hicolor-icon-theme
        firefox
      ];

    profile = ''
      export LC_ALL=C.UTF-8
      export XDG_DATA_DIRS="${xdg_dirs}''${XDG_DATA_DIRS:+:"$XDG_DATA_DIRS"}"
    '';

    extraInstallCommands = ''
      mv $out/bin/opossum-ui* $out/bin/${pname}
    '';
  };
}
