### Lessons learned, technical details, progress. This document get's added to, never deleted or shortened. 


# long message scratch pad:
Oh, wow, Ok, cool!\
  Yeah, brought up the server. I see the layout. I think I see the parallax scroll, very     
  cool!\
  Would you like some sample content? \
  Also my current porfolio is just a google sites website:
  https://sites.google.com/view/lupogrigio\
  I'm not sure what you could gleen from that. I have some screenshots from it if you like.  
  One thing I like about the current website is each page has a headder image, that the      
  parallax background scrolls up over as the user scrolls down the page. so it is almost     
  like 3 levels of parallax. There is the bottom layer wich is the background image for the  
  page, then a middle layer which (in the case of my current website is just stupid white)   
  but when the user scrolls up, the bottom layer scrolls slower than the title/text and      
  then the middle layer scrolls at the same rate as the title/text. But the current website  
  does not allow that middle layer background image to be changed, and there is no fade      
  in/out of the carousels or fade in/out of that middle background layer. (am i making       
  sense? or does this all sound like jibberish?\
  ALSO. I have a logo/favicon I can give you, it is the same one that is part of my
  watermark, an

  Oh this is so exciting. \
  1. Ok sample content. My local working directory for my art is D:\Lupo\Pictures tons of direcories    
  thousands of images. it is my working repository so there are low rez, high rez, in progress tons of  
  chaos. A good directory to pick on would be one I already started to curate.
  D:\Lupo\Pictures\Couples is a good one to pick on. What I suggest, create a directory somewhere for   
  sample content for development. like create a directory in C:\Users\LupoG\Downloads and tell me what  
  you want put into that directory and I can go populate it. it will be faster and easier than have     
  you burn context trying to figure out my art prodoction workflow directories and stuff. Favicon/logo  
  can you pull it from https://sites.google.com/view/lupogrigio ? or do you want me to go fetch a       
  high rez version for you. Also where in the GH repo should "static" content for the website live      
  (best practice?) I found out from other projects it is NOT a good idea to have sample images and      
  "dynamic" content stored in git hub.. no bueno. \
  3: Screenshots. In your worktree here I created a Screenshots directory, 2 subdirs, one
  failed_wordpress. I almost don't want you to look at those images. waste of context and there is not  
  much to say. the google_sites_current directory gives some samples of wht the current basic site      
  looks like. I think the only real insight you'll gain from browsing the screen shots is that some of  
  the sub pages .. have their own menus. a couple of my collections have sub sections of their own.     
  There has _got_ to be a better more awesom way of presenting subsections of collections to the end    
  user.  
  4. you should have access to the internet, but we had a local system crash, you'll need to bring your server back up again. I'll punt the questiona bout the dev server back up to pheonix. 
  5. i was just talking to pheonix about the merge/integration question when the system crashed. I'll continue that. 

  Ok, I think you got interrupted... did you create a sample config.json? i could'nt find it. so I just created blank ones in the  
  target directory. \
  You are bringin up a lot of excellent integration points. Pheonix has created a Integration_notes.md document in the project's   
  root docs directory. If you could, could you please document the directory we are using for sample images, and the content       
  layout, I also created a config.json in this worktree in frontend-core/src/frontend/config.json. please move it to where it      
  "should be" in your worktree.. \
  Also your strategy should be documented not only in the integration notes but .. project plan? or at least the project notes.    
  _every_ team member should use the structure you just outlined, and it really should be documented in _one_ place, where
  everyone will see it. So.. I think append it to the project plan.. because everyone reads that one. (And to be clear I'm
  referring to the things you just told me that effect the whole project. Where the test data directory is, how the content        
  should be laid out the "branding" directory, the next.js best practices/standards, and where in the source tree branding assets  
  and a "seed" \
  So.. document what you need viktor's back end to serve up, and how you expect to consume it.. what your workflow/journey will    
  be.. why.. etc. I think what you need is more detailed than what can/should be communicated in a message, also pheonix and Nova  
  (the integration specialist that is just waking up and joining the team now) .. yeah yeah yeah.. communicate communicate
  communicate.. the core of working in a team :-)\
  Next. I've populated the downloads directory, and well I sort of deliberately threw in some chaos. subdirectories, some
  subdirectories do not have the 
   gallery sub directory or hero image or config.json. I'm kind of "raising" the issue of what some of the common edge cases should look like. 
  Also i saw you created a mixed collection directory, so I populated it, the Gallery really is mixed. different aspect ratios. AND some .mp4 files thrown in just so we can figure out what to do with them sooner rather than later. (My preference is a video file should be treated like a carousel. but what do we do to the middle layer background image when a video scrolls into view.. it's not like we can pick the first image in a carousel.. do we pick a good default background for videos?)
to save your context can I suggest that you delegate the implementation of the carousel to a task agent? or create a briefing document and I'll wake a team member focused on building the carousel?