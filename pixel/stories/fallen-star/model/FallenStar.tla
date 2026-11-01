---- MODULE FallenStar ----
\* While the girl sleeps, Pip the bear helps a fallen star get home.
\* To climb into the clouds he needs a light. Above the clouds, the Moon Whale comes for a song,
\* or the cloud sheep can build a ladder to the sky.

VARIABLES place, light, song, starHome
vars == <<place, light, song, starHome>>

Places == {"window", "garden", "owl", "meadow", "pond", "clouds", "whale", "sky", "dreams", "sheep", "morning"}

Init == place = "window" /\ light = "none" /\ song = "none" /\ starHome = FALSE

SlipOut == place = "window" /\ place' = "garden" /\ UNCHANGED <<light, song, starHome>>

\* The owl teaches the old lullaby.
AskTheOwl == place = "garden" /\ place' = "owl" /\ song' = "lullaby" /\ UNCHANGED <<light, starHome>>

\* Two ways to get a light: the fireflies fill Pip's jar, or the frog fills it with moon-water.
FollowTheFireflies == place \in {"garden", "owl"} /\ place' = "meadow" /\ light' = "fireflies" /\ UNCHANGED <<song, starHome>>
VisitTheMoonPond == place \in {"garden", "owl"} /\ place' = "pond" /\ light' = "moon-water" /\ UNCHANGED <<song, starHome>>

ClimbTheCloudStairs == place \in {"meadow", "pond"} /\ light # "none" /\ place' = "clouds" /\ UNCHANGED <<light, song, starHome>>

\* Pip sings the owl's lullaby, or makes up a song of his own.
SingToTheMoon == place = "clouds" /\ place' = "whale" /\ song' = (IF song = "none" THEN "his own" ELSE song) /\ UNCHANGED <<light, starHome>>
LiftTwinkleHome == place = "whale" /\ place' = "sky" /\ starHome' = TRUE /\ UNCHANGED <<light, song>>
FloatHome == place = "sky" /\ place' = "dreams" /\ UNCHANGED <<light, song, starHome>>

\* The cloud sheep stack into a ladder, lift Twinkle home, and Pip falls asleep counting them.
FollowTheSheep == place = "clouds" /\ place' = "sheep" /\ UNCHANGED <<light, song, starHome>>
CountTheSheep == place = "sheep" /\ place' = "morning" /\ starHome' = TRUE /\ UNCHANGED <<light, song>>

TheEnd == place \in {"dreams", "morning"} /\ UNCHANGED vars

Next == SlipOut \/ AskTheOwl \/ FollowTheFireflies \/ VisitTheMoonPond \/ ClimbTheCloudStairs
          \/ SingToTheMoon \/ LiftTwinkleHome \/ FloatHome \/ FollowTheSheep \/ CountTheSheep \/ TheEnd

Spec == Init /\ [][Next]_vars

TypeOK == place \in Places /\ light \in {"none", "fireflies", "moon-water"} /\ song \in {"none", "lullaby", "his own"} /\ starHome \in BOOLEAN

\* Rules the story keeps.
LightInTheClouds == place \in {"clouds", "whale", "sky", "sheep"} => light # "none"
SongForTheWhale == place \in {"whale", "sky", "dreams"} => song # "none"
StarHomeBeforeTheEnd == place \in {"dreams", "morning"} => starHome
====
