---- MODULE FallenStar ----
\* While the girl sleeps, Pip the bear helps a fallen star get home.
\* To climb the cloud stairs he needs a light; to call the Moon Whale he needs a song.

VARIABLES place, light, song, starHome
vars == <<place, light, song, starHome>>

Places == {"window", "garden", "owl", "meadow", "clouds", "whale", "sky", "dreams"}

Init == place = "window" /\ light = FALSE /\ song = "none" /\ starHome = FALSE

SlipOut == place = "window" /\ place' = "garden" /\ UNCHANGED <<light, song, starHome>>

\* The owl teaches the old lullaby.
AskTheOwl == place = "garden" /\ place' = "owl" /\ song' = "lullaby" /\ UNCHANGED <<light, starHome>>

\* The fireflies lend a light.
FollowTheFireflies == place \in {"garden", "owl"} /\ place' = "meadow" /\ light' = TRUE /\ UNCHANGED <<song, starHome>>

ClimbTheCloudStairs == place = "meadow" /\ light /\ place' = "clouds" /\ UNCHANGED <<light, song, starHome>>

\* Pip sings the owl's lullaby, or makes up a song of his own.
SingToTheMoon == place = "clouds" /\ place' = "whale" /\ song' = (IF song = "none" THEN "his own" ELSE song) /\ UNCHANGED <<light, starHome>>

LiftTwinkleHome == place = "whale" /\ place' = "sky" /\ starHome' = TRUE /\ UNCHANGED <<light, song>>

FloatHome == place = "sky" /\ place' = "dreams" /\ UNCHANGED <<light, song, starHome>>

TheEnd == place = "dreams" /\ UNCHANGED vars

Next == SlipOut \/ AskTheOwl \/ FollowTheFireflies \/ ClimbTheCloudStairs \/ SingToTheMoon \/ LiftTwinkleHome \/ FloatHome \/ TheEnd

Spec == Init /\ [][Next]_vars

TypeOK == place \in Places /\ light \in BOOLEAN /\ song \in {"none", "lullaby", "his own"} /\ starHome \in BOOLEAN

\* Rules the story keeps.
LightInTheClouds == place \in {"clouds", "whale", "sky"} => light
SongForTheWhale == place \in {"whale", "sky", "dreams"} => song # "none"
StarHomeBeforeDreams == place = "dreams" => starHome
====
