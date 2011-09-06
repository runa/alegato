//
// On init
//

$(document).ready(function() {
    // Adding datepickers
    $( ".datepicker" ).datepicker({
        showOn: "button",
        buttonImage: "/images/calendar.gif",
        buttonImageOnly: true,
        changeMonth: true,
        changeYear: true,
        yearRange: '1973:1986',
        showOtherMonths: true
    });
    // Autocomplete person names
    $("#person_token").tokenInput("/doc/1/doc_admin/find_person", {
        crossDomain: false,
        theme: "facebook"
    });
	// agrandar el fragmento
	$(".more").click(function(e) { update_fragment( $(e.currentTarget).parent(), 1); });
	$(".less").click(function(e) { update_fragment( $(e.currentTarget).parent(), 2); });
	$(".down").click(function(e) { update_fragment( $(e.currentTarget).parent(), 3); });
	$(".up").click(function(e) { update_fragment( $(e.currentTarget).parent(), 4); });

	// Bindeamos todos los eventos de JS a los fragmentos
    $("p.fragment").each(
        function(idx,d){
        live_markup(d);
    });

  /*
	$("#milestone_human_date_from").datepicker({dateFormat: "dd/mm/yy", altFormat: "yy/mm/dd", altField: "#milestone_date_from"} );
	$("#milestone_human_date_to").datepicker({dateFormat: "dd/mm/yy", altFormat: "yy/mm/dd", altField: "#milestone_date_to"} );
  */
  $("#update_milestones").click( update_milestones)
  update_milestones()
  highlight();

});

function highlight(){
  $("p.fragment a.highlight").removeClass("highlight")
  $("#tags li").each(function(n,tag){
    var tag=$(tag)
    var search_str = tag.data("search")
    var class_name = "hl_"+search_str.replace(/[^a-z]/,"")
    $("p.fragment").highlight(search_str,{element: 'a', className: "highlight "+class_name})
    var count=$("p.fragment a.highlight."+class_name).removeClass(class_name).length
    $("span.count",tag).text("("+count+")")
    if (count > 0){
        tag.css({display: "block"})
    }else{
        tag.css({display: "none"})
    }
  })
}

function update_milestones(){
    var person_id = $("#milestone-pane").data("person-id")
    $.getJSON("/api/person/"+person_id+".json?milestones=true",{},function(d){set_milestones(d.milestones)})
}
function set_milestones(milestones){
    $("#milestones").empty()
    $(milestones).each(function(n,d){
        var li = $("<li>").attr("id",d.id).text(d.date_from+" - "+d.date_to+" - "+d.what +" -  "+d.where)
        li.append($("<button />").text("edit").click(function(e){edit_milestone(d,true)}))
        return $("#milestones").append(li)
    })
}
// Actualiza el fragmento
function update_fragment( el, cur_action) {

    var cur_fragment_id = el.attr('id');
		var context_around = 1000;

		$.getJSON("/admin/context", {fragment_id: cur_fragment_id, around: context_around, action: cur_action},
      function(response) {
        // NO anda. Dios sabrá x que. Hay que usar document.getElementById() aca.
        // item = $('#' + response.prev_fragment_id.replace(/(:|\.)/g,'\\$1'), $('#fragment-pane')); // escapamos los : y . en el ID
        item = $(document.getElementById(response.prev_fragment_id));
        //item.name = response.fragment_id;
        item.children("p.fragment").html(response.text)
        live_markup(item.children("p.fragment"))
        // le cambiamos el id al <li> con el nuevo fragmento.
        item.attr('id', response.fragment_id);
        highlight()
      }
		);
}
function edit_milestone(d,reset){
		$("#add_milestone").dialog({autoOpen: false, title: 'Nuevo hito', minWidth: 500});
    var date_from = d.date_from.split(/[-\/]/,3).reverse().join("/")
    var date_to = d.date_to.split(/[-\/]/,3).reverse().join("/")
		if (! $("#add_milestone").dialog("isOpen") || reset ){
		  $("#milestone_id").val(d.id);
		  $("#milestone_date_from").val(date_from);
		  $("#milestone_date_to").val(date_to);
		  $("#milestone_source").val(d.source);
      $("#milestone_what_opc option").attr("selected",false)
      var what_opc = $.grep($("#milestone_what_opc option"),function(opc){
          return $(opc).val() ==  d.what
      })
      if (what_opc.length > 0){
          $(what_opc).attr("selected",true)
      }else{
        $("#milestone_what_txt").val(d.what)
      }

      $("#milestone_where_opc option").attr("selected",false)
      var where_opc = $.grep($("#milestone_where_opc option"),function(opc){
          return $(opc).val() ==  d.where
      })
      if (where_opc.length > 0){
          $(where_opc).attr("selected",true)
      }else{
        $("#milestone_where_txt").val(d.where)
      }

      $("#del_milestone").css({visibility: d.id ? "visible" : "hidden"})
      $("#del_milestone").click(function(e){
          e.preventDefault();
          $.ajax({url: "/api/milestone/"+d.id+".json", type: "delete", success: update_milestones })
      })
		  $("#add_milestone").dialog("open");
		} else {
		  $("#milestone_date_to").val(date_to);
		}
}

function live_markup(o)
{
  // Cuando hacen click sobre una fecha mostramos el popup de Hitos.
  $(o).children(".date").click(function(e) {

		var date = $(e.currentTarget).attr("datetime");
    var d ={
        date_from: date,
        date_to: date,
        source: e.currentTarget.id,
    }
    edit_milestone(d)
  })

  // Cuando hacen click sobre un nombre mostramos la info de esa persona.
  $(o).children(".name").click(function(e){
    person_info($(e.currentTarget).text(), e.currentTarget.id, 'XXX');
  })

  // Cuando hacen click sobre una dirección ...
  $(o).children(".address").click(function(e) {
    if ( $("#add_milestone").dialog("isOpen") ) {
      var place_name = $(e.currentTarget).text().toLowerCase()
      console.log("placename: ", place_name)
      var match_opt = $("#milestone_where_opc option").filter(function(i,e){return $(e).val().toLowerCase() == place_name} )
      console.log("matching opc:", match_opt)
      if (match_opt.length > 0){
        match_opt.attr("selected",true)
      } else {
        $("#milestone_where_txt").val($(e.currentTarget).text())
      }
    }
  });
}

function add_milestone(person_name, milestone_date, fragment_id)
{
  console.log(person_name,milestone_date,fragment_id)
}

function person_info(name,fragment_id,related_to)
{
  var dialog_id = "dialog" + name.toLowerCase().replace(/[^a-z]/gi,"_")
  var dialog = $("#"+dialog_id)
  console.log(dialog_id)
  if (dialog.length){
    	dialog.dialog("open")
    	return
  }
  var dialog = $("<div class='person_info' id='"+dialog_id+"'></div>")
  dialog.html("<p><a href='"+name+"'>View in context</a></p>")
  var info = $("<p>")
  var loading_image = $("<img src='/images/ajax-loader.gif' />")
  info.append(loading_image)
  var milestones = $("<ol>")
  dialog.append(info.append(milestones))

  $(".body").append(dialog)
  dialog.dialog({title: name, width: 500})
  dialog.dialog("open")

  $.getJSON("/api/person/"+name,{milestones: true},
      function(d){
        $(loading_image).remove()
        console.log(d[0])
        if (d[0].milestones){
            $(d[0].milestones).each(function(n,milestone){
                milestones.append($("<li />").text(milestone.what+" " + milestone.date_from + " - " + milestone.date_to + " " + milestone.where))
            })
        }
      }
  );
}

function address_info(lat,lon,addr,fragment_id)
{
  var url="http://maps.google.com/maps/api/staticmap?size=200x200&markers=color:blue|"+lat+","+lon;
  $("#map #map_img").attr("src",url)
}

// vim: se ts=2 sw=2 expandtab:
