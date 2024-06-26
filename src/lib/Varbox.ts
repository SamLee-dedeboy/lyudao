import * as d3 from 'd3';
// import {tick} from 'svelte';
// import { scale } from 'svelte/transition';
import type  {tVariable,tVariableType,tMention, tNewLink, tRectangle, tRectObject, tLinkObject} from './types/variables';
import * as Constants from "./constants"
import {groupColors} from './constants/Colors';
// import socialIcon from '../../public/social.svg';

export const varbox = {
    init(svgId, width,height, paddings, handlers){
        this.clicked_rect = null
        this.clicked_link = null
        this.width = width
        this.height = height
        this.svgId = svgId
        this.handlers = handlers
        const self = this
        // this.topicName = Constants.topicname
        // this.topicEmotion = Constants.emotionname
        this.GroupColor = groupColors
        const svg = d3.select("#"+svgId).attr("viewBox", `0 0 ${width} ${height}`)
        .on("click", function(e) {
            if(!e.defaultPrevented) {
                console.log("remove all highlights")
                d3.selectAll("rect.box")
                    .classed("box-highlight", false)
                    .classed("box-not-highlight", false)
                    .transition() 
                    .duration(250) 
                    .attr("transform", ""); // Reset transformation on all boxes to remove any previous magnification
                d3.selectAll("text.label")
                    .classed("box-label-highlight", false)
                    .classed("box-label-not-highlight", false)
                d3.selectAll("path.link")
                    .classed("link-highlight", false)   
                    .classed("link-not-highlight", false)
                    .attr("stroke", "gray")
                    .attr("marker-end", "")
                handlers.VarOrLinkSelected(null)
                self.clicked_link = null
                self.clicked_rect = null
                // d3.selectAll("linearGradient").remove()
                // d3.selectAll("defs").remove()
            }
        });
        const driver_region = svg.select("g.driver_region")
        const pressure_region = svg.select("g.pressure_region")
        const state_region = svg.select("g.state_region")
        const impact_region = svg.select("g.impact_region")
        const response_region = svg.select("g.response_region")

        driver_region.append("g").attr("class","box-group")
        driver_region.append("g").attr("class","label-group")
        pressure_region.append("g").attr("class","box-group")
        pressure_region.append("g").attr("class","label-group")
        state_region.append("g").attr("class","box-group")
        state_region.append("g").attr("class","label-group")
        impact_region.append("g").attr("class","box-group")
        impact_region.append("g").attr("class","label-group")
        response_region.append("g").attr("class","box-group")
        response_region.append("g").attr("class","label-group")

    },

    // updateColorScales(drivers, pressures, states, impacts, responses) {
    //     let variables:any[] = [];
    //     variables.push(drivers,pressures,states,impacts,responses);
    //     // console.log(variables)
        
    //     // Use reduce to find the min and max lengths of mentions arrays
    //     let { minLength, maxLength } = variables.reduce((result, item) => {
    //         if (item.variable_mentions) {
    //         Object.values(item.variable_mentions).forEach((variable:any) => {
    //             if (variable.mentions) {
    //             const mentionsLength = variable.mentions.length;
    //             result.minLength = Math.min(result.minLength, mentionsLength);
    //             result.maxLength = Math.max(result.maxLength, mentionsLength);
    //             }
    //         });
    //         }
    //         return result;
    //     }, { minLength: Infinity, maxLength: -Infinity });
    //     const scaleColor = d3.scaleSequential([minLength, maxLength], d3.interpolateBlues)
    //     return scaleColor
    // },

    // updateRadialBoxes(drivers, pressures, states, impacts, responses) {
    //     let groups = ["Drivers","Pressures","States","Impacts","Responses"]
    //     const bboxes = radialBboxes(groups,1,1,{width: 1, height: 1})
    // },

    update_vars(drivers:tVariableType,pressures: tVariableType,states: tVariableType,impacts: tVariableType,responses: tVariableType,new_links:tNewLink[]){
        let variables:tVariableType[] = [];
        variables.push(drivers,pressures,states,impacts,responses);
        const frequencyList = calculateFrequencyList(variables,new_links) // includes variables frequency and link frequency among all groups
        
        let regionWidth = this.width/3.5;
        let regionHeight = this.height/6;
        const bboxes = radialBboxes(Constants.groupname,this.width,this.height,{width: regionWidth, height: regionHeight})
        const bboxes_sizes = {
            [Constants.groupname[0]]: [0.25*this.width, 0.2*this.height],
            [Constants.groupname[1]]: [0.3*this.width, 0.2*this.height],
            [Constants.groupname[2]]: [0.3*this.width, 0.2*this.height],
            [Constants.groupname[3]]: [0.4*this.width, 0.2*this.height],
            [Constants.groupname[4]]: [0.2*this.width, 0.2*this.height],
        }
        // console.log(bboxes)
        for (let i = 0; i < 5; i++) {
            this.drawvars(variables[i],Constants.groupclass[i],Constants.groupname[i],bboxes[Constants.groupname[i]],bboxes_sizes[Constants.groupname[i]][0],bboxes_sizes[Constants.groupname[i]][1])
        }
        const svg = d3.select("#"+this.svgId)
        const mergedData = new_links.map(link => {

            const source_block = document.getElementById(`${link.source.var_type}`);
            const target_block = document.getElementById(`${link.target.var_type}`);
            const sourceElement = document.getElementById(`${link.source.variable_name}`);
            const targetElement = document.getElementById(`${link.target.variable_name}`);
            if(sourceElement === null || targetElement === null || target_block === null || source_block === null){
                return null
            }
            const x_s = parseFloat(sourceElement.getAttribute('x')||'0');
            const y_s = parseFloat(sourceElement.getAttribute('y')||'0');
            const width_s = parseFloat(sourceElement.getAttribute('width')||'0');
            const height_s = parseFloat(sourceElement.getAttribute('height')||'0');

            const block_x_s = parseFloat(source_block.getAttribute('x')||'0');
            const block_y_s = parseFloat(source_block.getAttribute('y')||'0');
            const block_width_s = parseFloat(source_block.getAttribute('width')||'0');
            const block_height_s = parseFloat(source_block.getAttribute('height')||'0');

            const x_t = parseFloat(targetElement.getAttribute('x')||'0');
            const y_t = parseFloat(targetElement.getAttribute('y')||'0');
            const width_t = parseFloat(targetElement.getAttribute('width')||'0');
            const height_t = parseFloat(targetElement.getAttribute('height')||'0');

            const block_x_t = parseFloat(target_block.getAttribute('x')||'0');
            const block_y_t = parseFloat(target_block.getAttribute('y')||'0');
            const block_width_t = parseFloat(target_block.getAttribute('width')||'0');
            const block_height_t = parseFloat(target_block.getAttribute('height')||'0');
            // console.log({sourceElement,targetElement,target_block,source_block})

            const sourcePosition = {
                var_type: link.source.var_type,
                var_name: link.source.variable_name,
                x: x_s + width_s / 2, // Center X
                y: y_s + height_s / 2, // Center Y
                x_right: x_s + width_s, // Right edge, 10 units from the right
                x_left: x_s, // Left edge
                y_top: y_s, // Top edge
                y_bottom: y_s + height_s, // Bottom edge
                block_x: block_x_s + block_width_s / 2, // Center X of the block
                block_y: block_y_s + block_height_s / 2, // Center Y of the block
                block_y_top: block_y_s, // Top edge of the block
                block_y_bottom: block_y_s + block_height_s, // Bottom edge of the block
                newX_source:0, newY_source:0, 
            };
        
            const targetPosition = {
                var_type: link.target.var_type,
                var_name: link.target.variable_name,
                x: x_t + width_t / 2, // Center X
                y: y_t + height_t / 2, // Center Y
                x_right: x_t + width_t, // Right edge, 10 units from the right
                x_left: x_t, // Left edge
                y_top: y_t, // Top edge
                y_bottom: y_t + height_t, // Bottom edge
                block_x: block_x_t + block_width_t / 2, // Center X of the block
                block_y: block_y_t + block_height_t / 2, // Center Y of the block
                block_y_top: block_y_t, // Top edge of the block
                block_y_bottom: block_y_t + block_height_t, // Bottom edge of the block
                newX_target:0, newY_target:0,
            };
        
            return { source: sourcePosition, target: targetPosition,frequency: link.frequency, mentions: link.mentions};
        }).filter(data => data !== null);
        
        // console.log(mergedData);

    // console.log(selected_var_name)
    const self = this;
    let spacing = 20
    
    
    svg.select("g.link_group").selectAll(".link")
        .data(mergedData)
        .join("path")
        .attr("class", "link")
        .attr("id",(d: tLinkObject)=>`${d.source.var_name}`+"-"+`${d.target.var_name}`)
        .attr("d", function(d: tLinkObject,i) {
            let middleX1 
            let middleY1;
            if ((d.source.var_type == "drivers" && d.target.var_type == "pressures")) {
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))*3
                middleX1 = d.source.x+ (d.target.x-d.source.x) / 2; 
                middleY1 = d.source.block_y_top - threshold; // Target is top
                d.source.newX_source = d.source.x_right;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_left;
                d.target.newY_target = d.target.y;
            } 
            if ((d.source.var_type == "pressures" && d.target.var_type == "states")) {
                // console.log("entering drawing p to s")
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))
                middleX1 = d.target.x+2*(d.target.x-d.source.x) / 3; 
                middleY1 = d.source.block_y-(d.source.block_y- d.target.block_y)/4; // Target is top
                d.source.newX_source = d.source.x_right;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_right;
                d.target.newY_target = d.target.y;
            } 
            else if ((d.source.var_type == "states" && d.target.var_type == "impacts")) {
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))*2
                middleX1 = d.target.x+ Math.abs(d.target.x-d.source.x); 
                middleY1 = d.source.block_y_bottom + threshold; // Target is top
                d.source.newX_source = d.source.x_left;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_right;
                d.target.newY_target = d.target.y;
            } 
            if ((d.source.var_type == "impacts" && d.target.var_type == "responses")) {
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))*2
                middleX1 = d.source.x+ (d.target.x-d.source.x) /1.5; 
                middleY1 = d.source.block_y + threshold; // Target is top
                d.source.newX_source = d.source.x_left;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_right;
                d.target.newY_target = d.target.y;
            } 
            else if ((d.source.var_type == "responses" && d.target.var_type == "drivers")) {
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))
                middleX1 = d.target.x- Math.abs(d.target.x-d.source.x)*1.5; 
                middleY1 = d.source.block_y-(d.source.block_y- d.target.block_y)/2; // Target is top
                d.source.newX_source = d.source.x_left;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_left;
                d.target.newY_target = d.target.y;
            } 
            else if ((d.source.var_type == "responses" && d.target.var_type == "states")){
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))*2
                middleX1 = d.source.x+ (d.target.x-d.source.x) / 2; 
                middleY1 = d.source.block_y_top - threshold; // Target is top
                d.source.newX_source = d.source.x_right;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_left;
                d.target.newY_target = d.target.y;
            }
            else if ((d.source.var_type == "responses" && d.target.var_type == "pressures")){
                let threshold;
                threshold = Math.abs((d.source.block_y-d.source.y))*2
                middleX1 = d.source.x+ (d.target.x-d.source.x) / 2; 
                middleY1 = d.source.block_y - threshold; // Target is top
                d.source.newX_source = d.source.x_right;
                d.source.newY_source = d.source.y;
                d.target.newX_target = d.target.x_left;
                d.target.newY_target = d.target.y;
            }

            const path = d3.path();
            path.moveTo(d.source.newX_source, d.source.newY_source); // Start at the source

        
            // Curve to (middleX1, middleY1), descending to midPoint1
            path.quadraticCurveTo(
                middleX1, middleY1, // Control point at the first peak
                d.target.newX_target, d.target.newY_target // End at the first midpoint
            );
        
        
            return path.toString();
        })
        .attr("cursor", "pointer")
        .attr("fill", "none")
        // .attr("stroke", "url(#grad)")
        // .attr("stroke",d=> scaleColor(d.frequency))
        .attr("stroke", "gray")
        .attr("stroke-width", function(d: tLinkObject) {
            const widthSacle = d3.scaleLinear().domain([frequencyList.minLinkFrequency, frequencyList.maxLinkFrequency]).range([2, 15])
            return widthSacle(d.frequency);
        })
        .attr("opacity", 0.1)
        .on("mouseover", function(e, d: tLinkObject) {
            d3.select(this).classed("line-hover",true)
            d3.select(this.parentNode) // this refers to the path element, and parentNode is the SVG or a <g> element containing it
            .append("text")
            .attr("class", "link-frequency-text") // Add a class for styling if needed
            .attr("x", () => e.clientX +10) // Position the text in the middle of the link
            .attr("y", () => e.clientY - 20)
            .attr("text-anchor", "middle") // Center the text on its coordinates
            .attr("fill", "black") // Set the text color
            .text(d.frequency);
        })
        .on("mouseout", function(e, d) {
            d3.select(this).classed("line-hover",false)
            d3.selectAll(".link-frequency-text").remove();
        })
        .on("click", function(e, d: tLinkObject) {
            console.log(d)
            e.preventDefault()

            const links = d3.selectAll("path.link")
            .classed("link-highlight", false)
            .classed("link-not-highlight", true)
            .attr("stroke", "gray")
            .attr("marker-end", "")

            const rects = d3.selectAll("rect.box")
            .classed("box-highlight", false)
            .classed("box-not-highlight", true)

            const labels = d3.selectAll("text.label")
            .classed("box-label-highlight", false)
            .classed("box-label-not-highlight", true)


            if(self.clicked_link === d){
                self.clicked_link = null
                self.handlers.VarOrLinkSelected(null)
            }
            else{
                self.clicked_link = d
                self.handlers.VarOrLinkSelected(d)
                d3.select(this).classed("link-highlight", true).classed("link-not-highlight", false).raise()
                .attr("stroke", (d:tLinkObject) => {
                    const svg = d3.select("#"+self.svgId)                    
                    return createOrUpdateGradient(svg, d,self)
                })
                // .attr("marker-mid", `url(#${arrowId})`)
                .attr("marker-end", (d:tLinkObject) => {
                    const svg = d3.select("#"+self.svgId)
                    return createArrow(svg,d,self)
                });

                rects
                .filter((box_data:tRectObject) => box_data.variable_name === d.source.var_name || box_data.variable_name === d.target.var_name)
                .classed("box-highlight", true)
                .classed("box-not-highlight", false).raise()

                labels
                .filter((label_data:tRectObject) => label_data.variable_name === d.source.var_name || label_data.variable_name === d.target.var_name)
                .classed("box-label-highlight", true)
                .classed("box-label-not-highlight", false).raise()
            }
        })
    },

    drawvars(vars:tVariableType,class_name:string,group_name:string,box_coor,regionWidth:number,regionHeight:number){
        // console.log(vars)

        const rectheight = 35;
        const iconWidth = 24;
        const charWidth = 22;
        const rectangles = Object.values(vars.variable_mentions as Record<string, tVariable>)
        .sort((a, b) => b.mentions.length - a.mentions.length) // Sorting in descending order by mentions length
        .map(variable => ({
            name: variable.variable_name,
            width: (group_name==="Pressures")?(variable.variable_name.length) * charWidth + iconWidth : (variable.variable_name.length) * charWidth, 
            height: rectheight, 
        }));


        const self = this;

        // let MapRows = 3;
        // let  MapColumns = (VarsNum/MapRows)+1;

        const bbox_center = box_coor.center
        const bbox_origin = [bbox_center[0] - regionWidth/2, bbox_center[1] - regionHeight/2]
        const rectangleCoordinates = layoutRectangles(regionWidth, regionHeight, rectheight, rectangles, bbox_origin);
        const RectwithVar = combineData(vars,rectangleCoordinates); //return as an object
        // min and max frequency for all variables 
        // let max = Math.max(frequencyList.maxLength, frequencyList.maxFrequency); ???
        // let min = Math.min(frequencyList.minLength, frequencyList.minFrequency); ???
        // const scaleColor = d3.scaleSequential([min, max], d3.interpolateBlues)

        // min and max frequency for each group
        let minMentions = Infinity;
        let maxMentions = -Infinity;

        Object.values(vars.variable_mentions).forEach((variable:tVariable) => {
            const length = variable.mentions.length;
            if (length < minMentions) minMentions = length;
            if (length > maxMentions) maxMentions = length;
        });
        
        const scaleGroupColor = d3.scaleLinear().domain([minMentions, maxMentions]).range(["#f7f7f7", self.GroupColor(group_name.toLowerCase())]);

        const group = d3.select("#"+this.svgId).select("g."+class_name)
        group.select("g.box-group").append("rect")
        .attr("class", "bbox")
        .attr("id", `${group_name.toLowerCase()}`)
        .attr("x", bbox_center[0] - regionWidth/2)
        .attr("y", bbox_center[1] - regionHeight/2)
        .attr("width", regionWidth)
        .attr("height", regionHeight)
        .attr("fill", "none")
        .attr("stroke", "#cdcdcd")
        .attr("stroke-width", 1)
        .attr("opacity", "0") //do not show the bounding box
        .attr("rx", "5")

        group.select("g.box-group").append("text")
        .attr("class", "bbox-label")
        .attr("x", bbox_center[0])
        .attr("y", bbox_center[1] - regionHeight/2 - 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(group_name)
        .attr("pointer-events","none")
        .attr("font-family","serif")
        .attr("font-style", "italic")
        .attr("font-size", "3rem")
        .attr("font-weight", "bold")    
        .attr("fill", "#636363")
        .attr("fill",self.GroupColor(group_name.toLowerCase()))
        .attr("opacity", "0.8")


        
        group.select("g.box-group").append("image")
        .attr("xlink:href",function(){
            return group_name === "Drivers" ? "social.svg" : (group_name === "Pressures" ? "" : "ecological.svg")
        })
        .attr("x", bbox_center[0]+group_name.length*12)
        .attr("y", bbox_center[1] - regionHeight/2 -28)
        .attr("width", 30)
        .attr("height", 30)

        group.select("g.box-group").selectAll("rect.box")
        .data(RectwithVar)
        .join("rect")
        .attr("class", "box")
        .attr("id", (d: tRectObject) => d.variable_name)
        .attr("x", (d: tRectObject) => d.x)
        .attr("y", (d: tRectObject) => d.y)
        .attr("width", function(d: tRectObject) {
            const textWidth = d.variable_name.length * charWidth; // existing width calculation
            let width = 0;
            if(group_name === "Pressures"){
                width = textWidth + iconWidth; // add icon width to the text width
            }
            else{ width = textWidth; }
            return width // add icon width to the text width
            
        })
        .attr("height", rectheight)
        .attr("stroke", "#cdcdcd")
        .attr("stroke-width", "1px")
        .attr("rx", "5")
        .attr("fill", function(d: tRectObject) {
            if (d.frequency !== 0) {
                return scaleGroupColor(d.frequency);
                // return scaleColor(d.frequency);
            } else {
                return "#cdcdcd";
            }
        })
        .attr("opacity", "0.8")
        .attr("cursor", "pointer")
        .on("mouseover", function(e, d) { 
            d3.select(this).raise().classed("box-hover", true);
        
        })
        .on("mouseout", function(_, d) { 
            d3.select(this).classed("box-hover", false)

        })
        .on("click", function(e, d: tRectObject) {
            // console.log(d)
            e.preventDefault()

            d3.selectAll("rect.box")
            .transition() 
            .duration(250) 
            .attr("transform", ""); // Reset transformation on all boxes to remove any previous magnification
    

            const rects = d3.selectAll("rect.box")
            .classed("box-highlight", false)
            .classed("box-not-highlight", true).raise()
            const labels = d3.selectAll("text.label")
            .classed("box-label-highlight", false)
            .classed("box-label-not-highlight", true)
            

            // style changing after select a variable, including the links and labels
            if(self.clicked_rect === d) {
                self.clicked_rect = null
                self.handlers.VarOrLinkSelected(null)
                d3.selectAll(".link")
                .classed("link-highlight", false)
                .classed("link-not-highlight", false)
                rects.classed("box-highlight", false).classed("box-not-highlight", false)
                labels.classed("box-label-highlight", false).classed("box-label-not-highlight", false)
            }else{
                // console.log(d)
                self.clicked_rect = d
                
                self.handlers.VarOrLinkSelected(d)
                d3.select(this).classed("box-highlight", true).classed("box-not-highlight", false).raise()
                .transition()
                .duration(250)
                // .attr("transform", function() {
                //     const bbox = this.getBBox(); // Get bounding box of the element, which gives you its height, width, and position
                //     const scale = 1.2; // Define your scale factor
                //     // Calculate the center of the box
                //     const centerX = bbox.x + bbox.width / 2;
                //     const centerY = bbox.y + bbox.height / 2;
                //     // Scale about the center of the box
                //     return `translate(${centerX * (1 - scale)}, ${centerY * (1 - scale)}) scale(${scale})`;
                // });
                labels.filter((label_data:tRectObject) => d.variable_name === label_data.variable_name).classed("box-label-highlight", true).classed("box-label-not-highlight", false).raise()
                
                d3.selectAll(".link")
                .classed("link-highlight", false)
                .classed("link-not-highlight", true)
                .attr("stroke", "gray")
                .attr("marker-end", "")
                .filter((link_data:tLinkObject) => link_data.source.var_name === d.variable_name || link_data.target.var_name === d.variable_name)
                .classed("link-highlight", true)
                .classed("link-not-highlight", false).raise()
                .attr("stroke", (link_data:tLinkObject)=> {
                    // console.log(link_data)
                    const svg = d3.select("#"+self.svgId)                    
                    return createOrUpdateGradient(svg, link_data,self);

                    }
                )
                .attr("marker-end", (d: tLinkObject)=> {
                    const svg = d3.select("#"+self.svgId)
                    return createArrow(svg,d,self)
                });
                
            }
        })


        const texts = group.select("g.label-group").selectAll("text.label")
        .data(RectwithVar)
        .join("text")
        .text((d:tRectObject) => d.variable_name)
        .attr("class", "label")
        // .attr("x", (d: tRectObject) => d.x+ d.width/2 ) 
        .attr("x", (d: tRectObject) => { 
            if(group_name === "Pressures"){
                return (d.x + d.width/2) - iconWidth/2
            }
            else{
                return d.x + d.width/2
            }
            
        }) // slightly move text to the left within the rectangle
        .attr("y", (d: tRectObject) => d.y+ d.height/2)
        .attr("fill", "black")
        .attr("font-size", "1rem")
        // .attr("font-weight", "bold")   
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("pointer-events", "none")

        
        if(group_name === "Pressures"){
            
            const icons = group.select("g.label-group").selectAll(null)
            .data(RectwithVar)
            .enter()
            .append("image")
            .attr("xlink:href", function(d: tRectObject) {
                if (d.factor_type === "social") {
                    return "social.svg"; // path to the first type of icon
                } else {
                    return "ecological.svg"; // path to the second type of icon
                }
            })
            .attr("x", function(d: tRectObject) {
                const textWidth = d.variable_name.length * charWidth;
                return (d.x + d.width/2) - iconWidth/2 + textWidth/2.5 ; // position icon right after the text
            })
            .attr("y", function(d: tRectObject) {
                return d.y + (rectheight / 2) - 15; // vertically center icon in the rectangle
            })
            .attr("width", 24) // icon width
            .attr("height", 24) // icon height
            .attr("pointer-events", "none")
        }
        
        

        // const updatedData = addPropertiesToVariables(data); //add frequency properties to each variable

    },
}

function radialBboxes(groups, width, height, maxBboxSize) {
    const offset = 234 * Math.PI / 180
    const angleScale = d3.scaleBand().domain(groups).range([offset, offset+Math.PI * 2])
    let bboxes = {}
    const a = width/2 - maxBboxSize.width/2
    const b = height/2.5 - maxBboxSize.height/2.5
    groups.forEach((group, index) => {
        const scalefactor = 0.9
        const angle = angleScale(group)
        const r = (a*b)/Math.sqrt(Math.pow(b*Math.cos(angle), 2) + Math.pow(a*Math.sin(angle), 2))*scalefactor
        const x = width / 2 + r * Math.cos(angle)
        const y = height / 2 + r * Math.sin(angle)
        bboxes[group] = {
            center: [x, y]
        }
    })
    return bboxes
}
function layoutRectangles(regionWidth:number, regionHeight:number, rectheight:number, rectangles:tRectangle[], bbox_origin:number[])
:[number, number, number, number, string][] {
    let padding = 10;
    let xStart = padding; // Start x-coordinate, will be updated for center alignment
    let y = padding;
    let rowMaxHeight = 0;

    const rectangleCoordinates: [number, number, number, number, string][]  = [];

    // Function to reset for a new row
    function newRow(): void{
        y += rowMaxHeight + padding;
        rowMaxHeight = 0;
    }

    // Function to calculate row width (helper function)
    function calculateRowWidth(rectangles:tRectangle[]):number {
        return rectangles.reduce((acc, rect) => acc + rect.width + padding, 0) - padding; // Minus padding to adjust for extra padding at the end
    }

    // Temp array to hold rectangles for current row, to calculate total width for centering
    let tempRowRectangles:tRectangle[] = [];

    rectangles.forEach(rect => {
        if (xStart + calculateRowWidth(tempRowRectangles) + rect.width + padding > regionWidth) {
            // Center align previous row's rectangles before starting a new row
            let rowWidth = calculateRowWidth(tempRowRectangles);
            let startX = (regionWidth - rowWidth) / 2 + bbox_origin[0]; // Calculate starting X for center alignment

            // Assign coordinates with center alignment
            tempRowRectangles.forEach(tempRect => {
                rectangleCoordinates.push([startX, y + bbox_origin[1], tempRect.width, tempRect.height, tempRect.name]);
                startX += tempRect.width + padding;
            });

            // Reset for new row
            newRow();
            tempRowRectangles = [];
            xStart = padding;
        }

        // Add current rectangle to temp row for future processing
        tempRowRectangles.push(rect);
        rowMaxHeight = Math.max(rowMaxHeight, rect.height);
    });

    // Process the last row, if there are any rectangles left
    if (tempRowRectangles.length > 0) {
        let rowWidth = calculateRowWidth(tempRowRectangles);
        let startX = (regionWidth - rowWidth) / 2 + bbox_origin[0]; // Center align

        tempRowRectangles.forEach(tempRect => {
            rectangleCoordinates.push([startX, y + bbox_origin[1], tempRect.width, tempRect.height, tempRect.name]);
            startX += tempRect.width + padding;
        });
    }

    return rectangleCoordinates;
}

// function layoutRectangles(regionWidth, bigRectHeight, rowHeight, rectangles, bbox_origin) {
//         let padding = 10;
//         let x = padding;
//         let y = padding;
//         let row = 0;
//         let rowWidth = 0;

//         // console.log(rectangles)
//         const rectangleCoordinates :any[] = [];
    
//         rectangles.forEach(rect => {
//             if (x + rect.width + padding> regionWidth) {
//                 // Move to the next row
//                 y += rect.height + padding;
//                 x = padding;
//                 row++;
//                 rowWidth = 0;
//             }
//             rectangleCoordinates.push([ x, y, rect.width, rect.height,rect.name]);
    
//             x += rect.width + padding;
//             rowWidth += rect.width;
    
//             if (rowWidth > regionWidth) {
//                 throw new Error('Cannot fit rectangles within the big rectangle.');
//             }
//         });
//         rectangleCoordinates.forEach((coor) => {
//             coor[0] += bbox_origin[0];
//             coor[1] += bbox_origin[1];
//         });
//         // console.log(rectangleCoordinates)
//         return rectangleCoordinates
// }

function combineData(
    vars: tVariableType,
    rectangles: [number, number, number, number, string][]
  ): tRectObject[] {
    return rectangles.map(rect => {
      const [x, y, width, height, variable_name] = rect;
      const variable = vars.variable_mentions[variable_name];
      const mentions = variable?.mentions || [];
      const factor_type = variable?.factor_type;
      const frequency = mentions.length; 
  
      return {
        x, y, width, height, variable_name, mentions,factor_type, frequency
      };
    });
  }


//add chunk frequency and node frequency to each variable
function addPropertiesToVariables(data) {
    Object.keys(data).forEach(objectType => {
      const variables = data[objectType].variable_mentions;
      Object.keys(variables).forEach(variableName => {
        const mentions = variables[variableName].mentions;
        const chunkFrequency = mentions.length;
        const uniqueNodeIds = new Set();
        mentions.forEach(mention => {
          const nodeId = mention.chunk_id.split('_')[0];
          uniqueNodeIds.add(nodeId);
        });
        const nodeFrequency = uniqueNodeIds.size;
        variables[variableName].chunk_frequency = chunkFrequency;
        variables[variableName].node_frequency = nodeFrequency;
      });
    });
    return data;
  }

function createOrUpdateGradient(svg, link_data:tLinkObject,self) {
    const gradientId = `gradient-${link_data.source.var_name}-${link_data.target.var_name}`;

    // Attempt to select an existing gradient
    let gradient = svg.select(`#${gradientId}`);

    // If the gradient does not exist, create it
    if (gradient.empty()) {
        // console.log("Creating gradient", gradientId);
        gradient = svg.select('defs').append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", link_data.source.newX_source)
            .attr("y1", link_data.source.newY_source)
            .attr("x2", link_data.target.newX_target)
            .attr("y2", link_data.target.newY_target)
            .selectAll("stop")
            .data([
                {offset: "0%", color: self.GroupColor(link_data.source.var_type)},
                {offset: "100%", color: self.GroupColor(link_data.target.var_type)}
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
    }

    return `url(#${gradientId})`;
}


function createArrow(svg,d: tLinkObject,self){
    const arrowId = `arrow-${d.source.var_name}-${d.target.var_name}`
    let arrow = svg.select(`#${arrowId}`);
    if(arrow.empty()){
        svg.select('defs')
        .append('marker')
        .attr('id', arrowId)
        .attr('viewBox', [0, 0, 10, 10])
        .attr('refX', 5)
        .attr('refY', 5)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', d3.line()([[0, 0], [10, 5], [0, 10]]))
        .attr('fill',self.GroupColor(d.target.var_type));
        // .attr('fill', 'gray')
    }

    return `url(#${arrowId})`
}

// includes variables frequency and link frequency among all groups
function calculateFrequencyList(variables:any[],new_links:tNewLink[]){
    // let { minLength, maxLength } = variables.reduce((result, item) => {
    //     if (item.variable_mentions) {
    //     Object.values(item.variable_mentions).forEach((variable:any) => {
    //         if (variable.mentions) {
    //         const mentionsLength = variable.mentions.length;
    //         result.minLength = Math.min(result.minLength, mentionsLength);
    //         result.maxLength = Math.max(result.maxLength, mentionsLength);
    //         }
    //     });
    //     }
    //     return result;
    // }, { minLength: Infinity, maxLength: -Infinity });

    const maxLinkFrequency = new_links.reduce((max, link) => Math.max(max, link.frequency), 0);
    const minLinkFrequency = new_links.reduce((min, link) => Math.min(min, link.frequency), Infinity);

    const frequencyList = {
        // minLength: minLength,
        // maxLength: maxLength,
        minLinkFrequency: minLinkFrequency,
        maxLinkFrequency: maxLinkFrequency
    };

    return frequencyList;
}



